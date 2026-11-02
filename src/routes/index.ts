import { Router } from "express";
import moodRoutes from "./mood.routes.js";
import laguRoutes from "./lagu.routes.js";

const router = Router();

router.use("/mood", moodRoutes);
router.use("/lagu", laguRoutes);

export default router;