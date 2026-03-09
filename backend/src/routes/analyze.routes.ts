import { Router } from "express";
import { analyzeSignals } from "../services/analyzer.service.js";

const router = Router();

router.post("/api/analyze", async (req, res) => {
  try {
    const result = await analyzeSignals();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
