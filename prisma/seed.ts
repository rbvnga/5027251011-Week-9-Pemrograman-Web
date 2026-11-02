import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma.js";

const load = (file: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "data", file), "utf-8"));

// Kunci pembanding: judul + artis, huruf kecil
const kunci = (judul: string, artis: string) =>
  `${judul.trim()}|${artis.trim()}`.toLowerCase();

async function main() {
  // 1. Mood: buat kalau belum ada, perbarui kalau sudah
  const moods = load("mood.json");
  for (const m of moods) {
    await prisma.mood.upsert({
      where: { kode: m.kode },
      update: { nama: m.nama, warna: m.warna },
      create: { kode: m.kode, nama: m.nama, warna: m.warna },
    });
  }

  // 2. Peta kode -> id (id dibuat otomatis oleh database)
  const semuaMood = await prisma.mood.findMany();
  const petaMood = new Map(semuaMood.map((m) => [m.kode, m.id]));

  // 3. Daftar lagu yang sudah ada di database
  const ada = await prisma.lagu.findMany({ select: { judul: true, artis: true } });
  const sudahAda = new Set(ada.map((l) => kunci(l.judul, l.artis)));

  // 4. Ambil hanya lagu yang belum ada
  const lagu = load("lagu.json");
  const baru: any[] = [];
  for (const l of lagu) {
    const k = kunci(l.judul, l.artis);
    if (sudahAda.has(k)) continue;
    sudahAda.add(k);

    const moodId = petaMood.get(l.moodKode);
    if (!moodId) throw new Error(`moodKode tidak dikenal: "${l.moodKode}" (lagu: ${l.judul})`);

    baru.push({
      judul: l.judul,
      artis: l.artis,
      cerita: l.cerita ?? null,
      link: l.link ?? null,
      moodId,
    });
  }

  if (baru.length) await prisma.lagu.createMany({ data: baru });

  console.log(`Mood: ${moods.length} siap.`);
  console.log(`Lagu: ${baru.length} ditambahkan, ${lagu.length - baru.length} dilewati (sudah ada).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());