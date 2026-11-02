-- CreateTable
CREATE TABLE "mood" (
    "id" SERIAL NOT NULL,
    "kode" VARCHAR(30) NOT NULL,
    "nama" VARCHAR(40) NOT NULL,
    "warna" VARCHAR(7) NOT NULL,

    CONSTRAINT "mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lagu" (
    "id" SERIAL NOT NULL,
    "judul" VARCHAR(80) NOT NULL,
    "artis" VARCHAR(60) NOT NULL,
    "cerita" VARCHAR(200),
    "link" VARCHAR(500),
    "dibuat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubah" TIMESTAMP(3) NOT NULL,
    "moodId" INTEGER NOT NULL,

    CONSTRAINT "lagu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mood_kode_key" ON "mood"("kode");

-- CreateIndex
CREATE INDEX "lagu_moodId_idx" ON "lagu"("moodId");

-- AddForeignKey
ALTER TABLE "lagu" ADD CONSTRAINT "lagu_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "mood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
