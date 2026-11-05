# Clarity Backend Server (Node.js + Express + Supabase)

Backend API untuk aplikasi **Clarity Design Requirement & Brief Collection Platform** sesuai spesifikasi PRD.

---

## 🛠 Persiapan & Setup

### Langkah 1: Buat Proyek di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan login/daftar akun gratis.
2. Klik tombol **New project**.
3. Masukkan nama proyek (misal: `clarity-platform`) dan buat password database.
4. Pilih region terdekat (misal: `Singapore`). Klik **Create new project**.

---

### Langkah 2: Jalankan Script Database (Tabel & Relasi)
1. Di dashboard Supabase, klik menu **SQL Editor** di bilah navigasi kiri.
2. Klik **New query**.
3. Salin seluruh isi file [`server/schema.sql`](./schema.sql) dan tempel ke editor.
4. Klik tombol **Run** (hijau). Semua tabel (`clients`, `projects`, `briefs`, `assets`, `references`, dll.) akan langsung dibuat secara otomatis.

---

### Langkah 3: Buat Bucket File Storage
1. Di dashboard Supabase, buka menu **Storage**.
2. Klik tombol **New bucket**.
3. Beri nama: `project-assets`.
4. Centang **Public bucket** (agar preview file/gambar dapat diakses langsung oleh desainer).
5. Klik **Save**.

---

### Langkah 4: Hubungkan Kunci API Supabase ke Server
1. Di Supabase, buka **Project Settings** (ikon gear) -> **API**.
2. Salin:
   - **Project URL**
   - **service_role secret key** (klik reveal)
3. Di folder `server`, buat file `.env` (atau salin dari `.env.example`):
   ```env
   PORT=3001
   SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJh...rahasia...
   ```

---

## 🚀 Menjalankan Server Backend

1. Buka terminal di folder `server`:
   ```zsh
   cd server
   pnpm install
   ```

2. Jalankan server dalam mode development:
   ```zsh
   pnpm dev
   ```

3. Server akan berjalan di:
   👉 **http://localhost:3001**
   - Health check: `http://localhost:3001/api/health`

---

## 📡 Daftar Endpoint API

### 1. Projects (Desainer)
- `GET /api/projects` — Mengambil semua daftar proyek
- `POST /api/projects` — Membuat proyek baru & inisialisasi brief
- `GET /api/projects/:id` — Detail lengkap proyek, brief, referensi, aset
- `PATCH /api/projects/:id` — Mengubah data proyek
- `DELETE /api/projects/:id` — Menghapus proyek
- `POST /api/projects/:id/link/regenerate` — Regenerasi token link klien
- `POST /api/projects/:id/link/disable` — Menonaktifkan/mengaktifkan link
- `POST /api/projects/:id/review` — Approve brief, minta klarifikasi, atau reopen
- `PATCH /api/projects/:id/interpretation` — Catatan interpretasi internal desainer

### 2. Clients (Desainer)
- `GET /api/clients` — Daftar seluruh klien
- `POST /api/clients` — Menambah klien baru
- `GET /api/clients/:id` — Detail klien & riwayat proyek
- `PATCH /api/clients/:id` — Edit informasi klien
- `DELETE /api/clients/:id` — Hapus klien

### 3. Client Form (Publik via Token)
- `GET /api/c/:token` — Mengambil data intake brief untuk klien (tanpa data sensitif desainer)
- `PATCH /api/c/:token/brief` — Autosave setiap langkah pengisian form brief
- `POST /api/c/:token/submit` — Mengirimkan brief final ke desainer
- `POST /api/c/:token/assets` — Upload file aset (logo, guideline, foto) ke Supabase Storage
- `DELETE /api/c/:token/assets/:id` — Menghapus file aset

