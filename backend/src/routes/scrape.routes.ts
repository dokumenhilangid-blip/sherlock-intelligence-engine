import { Router } from "express";
import { scrapeReddit } from "../services/scraper.service.js";

const router = Router();

router.post("/api/scrape", async (req, res) => {
  try {
    const newSignals = await scrapeReddit();
    res.json({
      success: true,
      newSignals
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
