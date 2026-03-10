import { Router } from "express";
import healthRoutes from "./health.routes.js";
import dataRoutes from "./data.routes.js";
import scrapeRoutes from "./scrape.routes.js";
import analyzeRoutes from "./analyze.routes.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/", dataRoutes);
router.use("/", scrapeRoutes);
router.use("/", analyzeRoutes);

export default router;
