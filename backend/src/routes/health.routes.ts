import { Router } from "express";

const router = Router();

router.get("/test", (req, res) => {
  res.send("server alive");
});

router.get("/", (req, res) => {
  res.send("Sherlock Intelligence Engine running");
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
