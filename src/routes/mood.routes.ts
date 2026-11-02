import { Router } from "express";
import { getAllMood } from "../controllers/mood.controller.js";

const router = Router();

router.get("/", getAllMood);

export default router;