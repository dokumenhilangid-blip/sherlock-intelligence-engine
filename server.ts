import express from "express";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("intelligence.db");

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

app.use(express.json());

app.get("/test",(req,res)=>{
  res.send("server alive")
})

app.get("/",(req,res)=>{
  res.send("Sherlock Intelligence Engine running")
})

app.get("/health",(req,res)=>{
  res.json({status:"ok"})
})

app.get("/api/health",(req,res)=>{
  res.json({status:"ok"});
});

app.get("/api/signals",(req,res)=>{
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const signals = db.prepare(
    "SELECT * FROM signals ORDER BY published_at DESC LIMIT ?"
  ).all(limit);
  res.json(signals);
});

app.get("/api/opportunities",(req,res)=>{
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const opportunities = db.prepare(
    "SELECT * FROM opportunities ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  res.json(opportunities);
});

app.get("/api/tools",(req,res)=>{
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const tools = db.prepare(
    "SELECT * FROM tools ORDER BY added_at DESC LIMIT ?"
  ).all(limit);
  res.json(tools);
});

app.post("/api/scrape", async (req,res)=>{
  try{

    const redditRes = await fetch(
      "https://www.reddit.com/r/artificial/new.json?limit=10",
      {
        headers:{ "User-Agent":"SherlockAI/1.0" }
      }
    );

    let redditData:any = null;

    if(redditRes.ok){
      redditData = await redditRes.json();
    }

    let newSignals = 0;

    const insertSignal = db.prepare(
      "INSERT OR IGNORE INTO signals (source,title,url,content) VALUES (?,?,?,?)"
    );

    if(redditData?.data?.children){

      for(const child of redditData.data.children){

        const post = child.data;

        const result = insertSignal.run(
          "reddit",
          post.title,
          `https://reddit.com${post.permalink}`,
          post.selftext || ""
        );

        if(result.changes > 0){
          newSignals++;
        }

      }

    }

    res.json({
      success:true,
      newSignals
    });

  }catch(error:any){
    res.status(500).json({ error:error.message });
  }
});

app.post("/api/analyze", async (req,res)=>{

  try{

    const unprocessed = db.prepare(
      "SELECT * FROM signals WHERE processed = 0 LIMIT 10"
    ).all();

    if(unprocessed.length === 0){
      return res.json({
        success:true,
        message:"No unprocessed signals"
      });
    }

    const updateSignal = db.prepare(
      "UPDATE signals SET processed=1, sentiment=?, score=? WHERE id=?"
    );

    for(const signal of unprocessed as any[]){

      const prompt = `
Analyze this AI related signal:

Title: ${signal.title}
Content: ${signal.content}

Return JSON:
{
 "sentiment":0.5,
 "score":70
}
`;

      const response = await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents:prompt,
        config:{
          responseMimeType:"application/json"
        }
      });

      const result = JSON.parse(response.text || "{}");

      updateSignal.run(
        result.sentiment || 0,
        result.score || 0,
        signal.id
      );

    }

    res.json({
      success:true,
      processed:unprocessed.length
    });

  }catch(error:any){
    res.status(500).json({ error:error.message });
  }

});

const PORT = process.env.PORT || 8080;

app.listen(PORT,"0.0.0.0",()=>{
  console.log("Sherlock Intelligence Engine running on port",PORT);
});

}   // ← PENUTUP startServer()

startServer();
