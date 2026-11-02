import type { ErrorRequestHandler, RequestHandler } from "express";

// Untuk /api/... yang tidak ada
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
};

// Penampung semua error
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Format JSON tidak valid." });
    return;
  }
  if (err?.code === "P2025") { // Prisma: data tidak ditemukan
    res.status(404).json({ error: "Lagu tidak ditemukan." });
    return;
  }
  if (err?.code === "P2003") { // Prisma: moodId tidak ada di tabel mood
    res.status(400).json({ error: "Mood tidak valid." });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
};