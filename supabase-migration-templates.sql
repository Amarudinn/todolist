-- Migration: Tambah tabel todo_templates untuk fitur auto-insert
-- Jalankan SQL ini di Supabase SQL Editor

CREATE TABLE todo_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;

-- Policy untuk allow semua operasi (untuk development/personal use)
CREATE POLICY "Allow all operations on templates" ON todo_templates
  FOR ALL
  USING (true)
  WITH CHECK (true);
