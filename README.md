# Todo PWA

Aplikasi Todo List modern dengan fitur PWA (Progressive Web App), dark theme, dan penyimpanan cloud menggunakan Supabase.

![Todo PWA Screenshot](screenshots/preview.png)

## Fitur

- ✅ Tambah, edit, dan hapus todo
- ✅ Checklist todo selesai/belum
- ✅ Pilih semua / batalkan semua
- ✅ Complete day (kunci hari ini)
- ✅ Reset otomatis setiap ganti hari
- ✅ History todo per tanggal
- ✅ Password protection
- ✅ Dark theme modern
- ✅ Responsive (mobile friendly)
- ✅ PWA (bisa di-install)
- ✅ Data tersimpan di cloud (Supabase)

## Tech Stack

- React 19
- Vite
- CSS Modules
- Supabase
- PWA (vite-plugin-pwa)

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/amarudinn/todo-pwa.git
cd todo-pwa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Buka SQL Editor dan jalankan query berikut:

```sql
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON todos
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

3. Copy URL dan anon key dari Settings > API

### 4. Setup Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_APP_PASSWORD=password_rahasia_kamu
```

### 5. Jalankan development server

```bash
npm run dev
```

Buka http://localhost:5173

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PASSWORD`
4. Deploy

## Cara Penggunaan

### Login
Masukkan password yang sudah diset di environment variable untuk mengakses aplikasi.

### Tambah Todo
Ketik tugas di kolom input lalu klik tombol + untuk menambahkan.

### Selesaikan Todo
Klik checkbox di sebelah kiri todo untuk menandai selesai.

### Hapus Todo
Klik icon tempat sampah untuk menghapus todo.

### Pilih/Batalkan Semua
Gunakan tombol untuk memilih atau membatalkan semua todo sekaligus.

### Complete
Klik tombol Complete untuk mengunci hari ini. Setelah diklik, tidak bisa menambah atau mengubah todo lagi.

### History
Lihat riwayat todo di tab History. Klik tanggal untuk melihat detail.

### Reset Harian
Todo otomatis reset setiap ganti hari. Todo kemarin tersimpan di History.

## License

MIT
