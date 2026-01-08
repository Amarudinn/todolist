-- Migration: Tambah kolom date untuk existing table
-- Jalankan SQL ini di Supabase SQL Editor jika table todos sudah ada

-- Tambah kolom date
ALTER TABLE todos ADD COLUMN IF NOT EXISTS date DATE;

-- Set default value untuk existing rows (gunakan created_at sebagai referensi)
UPDATE todos 
SET date = (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta')::DATE 
WHERE date IS NULL;

-- Set NOT NULL constraint setelah data terisi
ALTER TABLE todos ALTER COLUMN date SET NOT NULL;

-- Set default untuk insert baru
ALTER TABLE todos ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Tambah index untuk performa
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
