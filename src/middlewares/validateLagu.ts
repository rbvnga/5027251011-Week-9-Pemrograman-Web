import type { RequestHandler } from "express";
import { isHttpUrl } from "../utils/validators.js";

// Memastikan :id berupa bilangan bulat positif
export const validateId: RequestHandler = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "ID tidak valid." });
    return;
  }
  res.locals.id = id;
  next();
};

// Memvalidasi dan membersihkan body untuk POST dan PUT
export const validateLagu: RequestHandler = (req, res, next) => {
  const b = req.body ?? {};
  const errors: Record<string, string> = {};

  const judul = typeof b.judul === "string" ? b.judul.trim() : "";
  if (!judul) errors.judul = "Judul wajib diisi.";
  else if (judul.length > 80) errors.judul = "Judul maksimal 80 karakter.";

  const artis = typeof b.artis === "string" ? b.artis.trim() : "";
  if (!artis) errors.artis = "Nama artis wajib diisi.";
  else if (artis.length > 60) errors.artis = "Nama artis maksimal 60 karakter.";

  const moodId = Number(b.moodId);
  if (!Number.isInteger(moodId) || moodId < 1) errors.moodId = "Mood tidak valid.";

  // cerita dan link opsional: kosong / null dianggap null
  let cerita: string | null = null;
  if (b.cerita !== undefined && b.cerita !== null && b.cerita !== "") {
    if (typeof b.cerita !== "string") errors.cerita = "Cerita harus berupa teks.";
    else {
      cerita = b.cerita.trim() || null;
      if (cerita && cerita.length > 200) errors.cerita = "Cerita maksimal 200 karakter.";
    }
  }

  let link: string | null = null;
  if (b.link !== undefined && b.link !== null && b.link !== "") {
    if (typeof b.link !== "string") errors.link = "Link harus berupa teks.";
    else {
      link = b.link.trim() || null;
      if (link && link.length > 500) errors.link = "Link maksimal 500 karakter.";
      else if (link && !isHttpUrl(link)) errors.link = "Link harus diawali http:// atau https://";
    }
  }

  const pesan = Object.values(errors)[0];
  if (pesan) {
    res.status(400).json({ error: pesan, errors });
    return;
  }

  // Hanya field yang diizinkan yang diteruskan ke controller
  req.body = { judul, artis, moodId, cerita, link };
  next();
};

// Validasi untuk PATCH: hanya field yang dikirim yang diperiksa
export const validatePatchLagu: RequestHandler = (req, res, next) => {
  const b = req.body ?? {};
  const errors: Record<string, string> = {};
  const data: Record<string, string | number | null> = {};

  if ("judul" in b) {
    const judul = typeof b.judul === "string" ? b.judul.trim() : "";
    if (!judul) errors.judul = "Judul wajib diisi.";
    else if (judul.length > 80) errors.judul = "Judul maksimal 80 karakter.";
    else data.judul = judul;
  }

  if ("artis" in b) {
    const artis = typeof b.artis === "string" ? b.artis.trim() : "";
    if (!artis) errors.artis = "Nama artis wajib diisi.";
    else if (artis.length > 60) errors.artis = "Nama artis maksimal 60 karakter.";
    else data.artis = artis;
  }

  if ("moodId" in b) {
    const moodId = Number(b.moodId);
    if (!Number.isInteger(moodId) || moodId < 1) errors.moodId = "Mood tidak valid.";
    else data.moodId = moodId;
  }

  // cerita dan link: kosong atau null berarti dikosongkan
  if ("cerita" in b) {
    if (b.cerita === null || b.cerita === "") data.cerita = null;
    else if (typeof b.cerita !== "string") errors.cerita = "Cerita harus berupa teks.";
    else {
      const cerita = b.cerita.trim();
      if (cerita.length > 200) errors.cerita = "Cerita maksimal 200 karakter.";
      else data.cerita = cerita || null;
    }
  }

  if ("link" in b) {
    if (b.link === null || b.link === "") data.link = null;
    else if (typeof b.link !== "string") errors.link = "Link harus berupa teks.";
    else {
      const link = b.link.trim();
      if (link.length > 500) errors.link = "Link maksimal 500 karakter.";
      else if (link && !isHttpUrl(link)) errors.link = "Link harus diawali http:// atau https://";
      else data.link = link || null;
    }
  }

  const pesan = Object.values(errors)[0];
  if (pesan) {
    res.status(400).json({ error: pesan, errors });
    return;
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Tidak ada data yang diubah." });
    return;
  }

  req.body = data; // hanya field valid yang diteruskan
  next();
};