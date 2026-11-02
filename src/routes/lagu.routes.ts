import { Router } from "express";
import {
  getAllLagu,
  getLaguAcak,
  getLaguById,
  createLagu,
  updateLagu,
  deleteLagu,
} from "../controllers/lagu.controller.js";
import { validateLagu, validatePatchLagu, validateId } from "../middlewares/validateLagu.js";
const router = Router();

router.get("/", getAllLagu);
router.get("/acak", getLaguAcak); 
router.get("/:id", validateId, getLaguById); 
router.post("/", validateLagu, createLagu);
router.put("/:id", validateId, validateLagu, updateLagu);
router.patch("/:id", validateId, validatePatchLagu, updateLagu);
router.delete("/:id", validateId, deleteLagu);

export default router;