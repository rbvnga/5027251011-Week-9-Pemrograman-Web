import { Router } from "express";
import { getAllMood, getMoodById } from "../controllers/mood.controller.js";
import { validateId } from "../middlewares/validateLagu.js";

const router = Router();

router.get("/", getAllMood);
router.get("/:id", validateId, getMoodById);

export default router;