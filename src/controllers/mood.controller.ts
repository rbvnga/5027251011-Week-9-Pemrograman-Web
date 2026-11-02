import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/mood
export const getAllMood = async (_req: Request, res: Response) => {
  const moods = await prisma.mood.findMany({ orderBy: { id: "asc" } });
  res.json(moods);
};