# Migration Guide - Update Database Schema

## Untuk User yang Sudah Punya Table `todos`

Jika kamu sudah punya aplikasi ini berjalan sebelumnya, kamu perlu menambah kolom `date` ke table yang sudah ada.

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke [supabase.com](https://supabase.com)
   - Pilih project kamu

2. **Buka SQL Editor**
   - Klik menu "SQL Editor" di sidebar kiri
   - Klik "New query"

3. **Jalankan Migration SQL**
   - Copy semua isi dari file `supabase-migration-add-date.sql`
   - Paste ke SQL Editor
   - Klik "Run" atau tekan Ctrl+Enter

4. **Verifikasi**
   - Buka "Table Editor" → pilih table `todos`
   - Pastikan ada kolom baru bernama `date` dengan type `DATE`
   - Semua row existing harus sudah terisi nilai `date` nya

5. **Deploy Aplikasi**
   - Push code terbaru ke repository
   - Deploy ulang aplikasi (Vercel/Netlify/dll)

### Apa yang Berubah?

**Sebelum:**
- Task di-filter berdasarkan `created_at` (timestamp)
- Timezone issue bisa bikin task hilang

**Sesudah:**
- Task di-filter berdasarkan `date` (date only)
- Tidak ada timezone issue lagi
- Button "Complete Day" bisa pindahin semua task ke history dan mulai task besok

### Troubleshooting

**Q: Error "column date does not exist"**
A: Jalankan migration SQL di Supabase SQL Editor

**Q: Task lama tidak muncul di history**
A: Migration SQL otomatis set `date` berdasarkan `created_at` dengan timezone WIB

**Q: Ingin reset working date ke hari ini**
A: Buka browser console dan jalankan:
```javascript
localStorage.removeItem('currentWorkingDate')
```
Lalu refresh halaman.

## Untuk User Baru

Jika kamu baru setup aplikasi ini, cukup jalankan SQL dari file `supabase-schema.sql` saja. Tidak perlu migration.
