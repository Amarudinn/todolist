-- Jalankan SQL ini di Supabase SQL Editor untuk membuat tabel todos

CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (opsional, untuk public access)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy untuk allow semua operasi (untuk development)
CREATE POLICY "Allow all operations" ON todos
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Migration: Tambah kolom date untuk existing table (jalankan jika table sudah ada)
-- ALTER TABLE todos ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
-- CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);
