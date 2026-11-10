import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/mood
export const getAllMood = async (_req: Request, res: Response) => {
  const moods = await prisma.mood.findMany({ orderBy: { id: "asc" } });
  res.json(moods);
};

// GET /api/mood/:id
export const getMoodById = async (_req: Request, res: Response) => {
  const mood = await prisma.mood.findUnique({
    where: { id: res.locals.id },
  });

  if (!mood) {
    res.status(404).json({ error: "Mood tidak ditemukan." });
    return;
  }
  res.json(mood);
};