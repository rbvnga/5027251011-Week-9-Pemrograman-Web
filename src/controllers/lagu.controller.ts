import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// GET /api/lagu
// Opsional: ?page=1&limit=10&mood=begadang&q=adele
export const getAllLagu = async (req: Request, res: Response) => {
  const mood = typeof req.query.mood === "string" && req.query.mood ? req.query.mood : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const where = {
    ...(mood ? { mood: { kode: mood } } : {}),
    ...(q
      ? {
          OR: [
            { judul: { contains: q, mode: "insensitive" as const } },
            { artis: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Tanpa page/limit: kembalikan semua (array biasa), front-end tetap jalan
  if (req.query.page === undefined && req.query.limit === undefined) {
    const semua = await prisma.lagu.findMany({
      where,
      include: { mood: true },
      orderBy: { id: "desc" },
    });
    res.json(semua);
    return;
  }

  // Dengan page/limit: kembalikan data + meta
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 10));

  const [total, data] = await Promise.all([
    prisma.lagu.count({ where }),
    prisma.lagu.findMany({
      where,
      include: { mood: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// GET /api/lagu/acak?mood=[nama mood]
export const getLaguAcak = async (req: Request, res: Response) => {
  const kode = typeof req.query.mood === "string" && req.query.mood ? req.query.mood : undefined;
  const where = kode ? { mood: { kode } } : {};

  const total = await prisma.lagu.count({ where });
  if (total === 0) {
    res.status(404).json({ error: "Belum ada lagu pada mood ini." });
    return;
  }

  const lagu = await prisma.lagu.findFirst({
    where,
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * total),
    include: { mood: true },
  });
  res.json(lagu);
};

// GET /api/lagu/:id
export const getLaguById = async (_req: Request, res: Response) => {
  const lagu = await prisma.lagu.findUnique({
    where: { id: res.locals.id },
    include: { mood: true },
  });

  if (!lagu) {
    res.status(404).json({ error: "Lagu tidak ditemukan." });
    return;
  }
  res.json(lagu);
};

// POST /api/lagu  -> 201
export const createLagu = async (req: Request, res: Response) => {
  const lagu = await prisma.lagu.create({
    data: req.body,
    include: { mood: true },
  });
  res.status(201).json(lagu);
};

// PUT /api/lagu/:id  -> 200
export const updateLagu = async (req: Request, res: Response) => {
  const lagu = await prisma.lagu.update({
    where: { id: res.locals.id },
    data: req.body,
    include: { mood: true },
  });
  res.json(lagu);
};

// DELETE /api/lagu/:id  -> 200
export const deleteLagu = async (_req: Request, res: Response) => {
  await prisma.lagu.delete({ where: { id: res.locals.id } });
  res.json({ pesan: "Lagu dikeluarkan dari toples." });
};