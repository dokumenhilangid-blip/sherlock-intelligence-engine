import { Router } from "express";
import db from "../config/db.js";

const router = Router();

router.get("/api/signals", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const signals = db.prepare(
    "SELECT * FROM signals ORDER BY published_at DESC LIMIT ?"
  ).all(limit);
  res.json(signals);
});

router.get("/api/opportunities", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const opportunities = db.prepare(
    "SELECT * FROM opportunities ORDER BY created_at DESC LIMIT ?"
  ).all(limit);
  res.json(opportunities);
});

router.get("/api/tools", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const tools = db.prepare(
    "SELECT * FROM tools ORDER BY added_at DESC LIMIT ?"
  ).all(limit);
  res.json(tools);
});

export default router;
