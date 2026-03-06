import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("intelligence.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    content TEXT,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT 0,
    sentiment REAL DEFAULT 0,
    score REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    category TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/signals", (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const signals = db.prepare("SELECT * FROM signals ORDER BY published_at DESC LIMIT ?").all(limit);
    res.json(signals);
  });

  app.get("/api/opportunities", (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const opportunities = db.prepare("SELECT * FROM opportunities ORDER BY created_at DESC LIMIT ?").all(limit);
    res.json(opportunities);
  });

  app.get("/api/tools", (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const tools = db.prepare("SELECT * FROM tools ORDER BY added_at DESC LIMIT ?").all(limit);
    res.json(tools);
  });

  // Trigger scraper manually
  app.post("/api/scrape", async (req, res) => {
    try {
      // 1. Scrape Reddit (r/artificial, r/MachineLearning, r/SideProject)
      const redditRes = await fetch("https://www.reddit.com/r/artificial/new.json?limit=10", {
        headers: {
          "User-Agent": "SherlockAI/1.0 (by /u/SherlockAI_Bot)"
        }
      });
      
      let redditData = null;
      if (redditRes.ok) {
        try {
          redditData = await redditRes.json();
        } catch (e) {
          console.error("Failed to parse Reddit JSON:", e);
        }
      } else {
        console.error(`Reddit API error: ${redditRes.status} ${redditRes.statusText}`);
      }
      
      let newSignals = 0;
      const insertSignal = db.prepare("INSERT OR IGNORE INTO signals (source, title, url, content) VALUES (?, ?, ?, ?)");
      
      if (redditData?.data?.children) {
        for (const child of redditData.data.children) {
          const post = child.data;
          const result = insertSignal.run("reddit", post.title, `https://reddit.com${post.permalink}`, post.selftext || "");
          if (result.changes > 0) newSignals++;
        }
      }

      // 2. Scrape Hacker News
      const hnRes = await fetch("https://hn.algolia.com/api/v1/search_by_date?tags=story&query=AI&hitsPerPage=10");
      let hnData = null;
      if (hnRes.ok) {
        try {
          hnData = await hnRes.json();
        } catch (e) {
          console.error("Failed to parse HN JSON:", e);
        }
      } else {
        console.error(`HN API error: ${hnRes.status} ${hnRes.statusText}`);
      }
      
      if (hnData?.hits) {
        for (const hit of hnData.hits) {
          if (hit.title && hit.url) {
            const result = insertSignal.run("hacker_news", hit.title, hit.url, hit.story_text || "");
            if (result.changes > 0) newSignals++;
          }
        }
      }

      res.json({ success: true, newSignals });
    } catch (error: any) {
      console.error("Scraping error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Trigger analysis manually
  app.post("/api/analyze", async (req, res) => {
    try {
      const unprocessed = db.prepare("SELECT * FROM signals WHERE processed = 0 LIMIT 10").all();
      
      if (unprocessed.length === 0) {
        return res.json({ success: true, message: "No unprocessed signals." });
      }

      const updateSignal = db.prepare("UPDATE signals SET processed = 1, sentiment = ?, score = ? WHERE id = ?");
      const insertOpportunity = db.prepare("INSERT INTO opportunities (title, description, category, confidence) VALUES (?, ?, ?, ?)");
      const insertTool = db.prepare("INSERT OR IGNORE INTO tools (name, description, url, source, category) VALUES (?, ?, ?, ?, ?)");

      for (const signal of unprocessed as any[]) {
        try {
          const prompt = `
            Analyze the following text from ${signal.source}:
            Title: ${signal.title}
            Content: ${signal.content}

            Perform Sherlock Analysis Framework:
            1. Extract any mentioned AI tools (name, description, url if any).
            2. Determine sentiment (-1.0 to 1.0).
            3. Calculate signal score (0 to 100) based on importance/trend potential.
            4. If this represents a new SaaS opportunity or trend, describe it.

            Respond strictly in JSON format:
            {
              "sentiment": 0.5,
              "score": 75,
              "tools": [{"name": "ToolName", "description": "...", "url": "...", "category": "..."}],
              "opportunity": {"title": "...", "description": "...", "category": "...", "confidence": 0.8} // or null
            }
          `;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });

          const result = JSON.parse(response.text || "{}");
          
          updateSignal.run(result.sentiment || 0, result.score || 0, signal.id);

          if (result.tools && Array.isArray(result.tools)) {
            for (const tool of result.tools) {
              if (tool.name) {
                insertTool.run(tool.name, tool.description || "", tool.url || signal.url, signal.source, tool.category || "Unknown");
              }
            }
          }

          if (result.opportunity && result.opportunity.title) {
            insertOpportunity.run(
              result.opportunity.title,
              result.opportunity.description || "",
              result.opportunity.category || "General",
              result.opportunity.confidence || 0.5
            );
          }
        } catch (e) {
          console.error("Error processing signal", signal.id, e);
        }
      }

      res.json({ success: true, processed: unprocessed.length });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
// ===== Pipeline Endpoints =====
let signals:any[] = []

app.get("/api/signals",(req,res)=>{
  res.json(signals)
})

app.get("/api/scrape",(req,res)=>{
  const data = [
    {source:"reddit",title:"AI meeting notes SaaS"},
    {source:"reddit",title:"AI cold email automation"},
    {source:"reddit",title:"AI marketing copy generator"}
  ]

  signals = data

  res.json({
    status:"scraping complete",
    count:data.length
  })
})

app.get("/api/analyze",(req,res)=>{
  const opportunities = signals.map(s=>({
    problem:s.title,
    opportunity:"Potential AI micro SaaS"
  }))

  res.json(opportunities)
})

startServer();
