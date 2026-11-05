# PRD — Design Requirement & Brief Collection Platform

**Versi:** 2.0 (revisi, siap-bangun) · **Status:** MVP Definition · **Platform:** Web App (responsif, mobile-first untuk sisi klien) · **Bahasa dokumen:** Indonesia (istilah teknis dalam Inggris)

> **Tagline:** Collect better briefs. Design with clarity.

## 0. Cara membaca dokumen ini (untuk AI builder)

- Dokumen ini adalah sumber kebenaran tunggal. Jika ada konflik, urutan prioritas: **Bagian 4 (Keputusan)** > bagian lain.
- Setiap requirement punya ID (`FR-xx`, `AC-xx`) dan label prioritas **P0** (wajib MVP), **P1** (setelah MVP), **P2** (masa depan). **Bangun hanya P0** kecuali diminta lain.
- Nama field, enum, dan route ditulis dalam `code` dan harus dipakai persis seperti tertulis.
- Bagian 21 berisi urutan build yang disarankan. Bagian 20 berisi acceptance criteria untuk menguji hasil.
- Jangan menambah fitur di luar scope (lihat Non-Goals, Bagian 2).

## 1. Ringkasan Produk

Aplikasi web personal untuk **freelance Graphic Designer dan UI/UX Designer**. Designer membuat project, membagikan **link unik** ke klien, klien mengisi form requirement yang progresif dan visual (tanpa akun), lalu sistem menghasilkan **Design Brief terstruktur** yang direview, diberi interpretasi, dan disetujui oleh designer.

**Proposisi inti:** mengubah ide klien yang subjektif ("bikin modern, premium, tapi jangan terlalu korporat") menjadi brief yang jelas dan siap dipakai mendesain.

**Diferensiasi:** form progresif + **Visual Style Cards** + koleksi referensi + koleksi aset + brief yang berorientasi designer.

## 2. Masalah, Tujuan, Non-Goals

### Masalah

Requirement tersebar di WhatsApp, email, meeting, screenshot, voice note. Informasi tidak lengkap, ambigu, sulit dicari, dan memakai bahasa non-desainer. Designer harus menebak audience, perasaan yang diinginkan, referensi, batasan, aset, konten, dan output.

### Goals

1. Mengumpulkan requirement desain yang lengkap dan dapat ditindaklanjuti.
2. Mengurangi bolak-balik sebelum desain dimulai.
3. Menerjemahkan bahasa klien menjadi data terstruktur.
4. Memudahkan komunikasi preferensi visual lewat kartu visual, mood, dan referensi.
5. Memberi designer brief final yang bisa dibaca < 5 menit.

### Non-Goals (JANGAN dibangun)

- Project/task management, time tracking, invoicing.
- Feedback revisi, approval desain final, delivery file.
- Chat, CRM, kolaborasi tim, kalender, versioning file.
- Pengganti workflow produksi designer.

**Batas produk:** Client Requirement → Requirement Collection → Designer Review → Approved Brief → **STOP**.

## 3. Pengguna & Workflow

| Peran | Deskripsi | Autentikasi |
|---|---|---|
| **Designer** (primer) | Freelancer yang membuat client/project, mengirim link, mereview, menyetujui brief | Akun (email+password, Google OAuth) |
| **Client** (sekunder) | Non-desainer; mengisi form lewat link, kebanyakan dari ponsel (WhatsApp) | **Tanpa akun**; akses via token project |

**Workflow utama**

1. Designer: buat client → buat project (isi type, objective, deliverables, deadline) → generate & salin link.
2. Client: buka link → Welcome → isi step progresif → upload aset → Review → Submit.
3. Designer: menerima notifikasi email → review submission → (opsional) minta klarifikasi → tambah Designer Interpretation → Approve.
4. Sistem: menghasilkan Approved Brief terstruktur.

## 4. Keputusan & Asumsi Produk (mengikat)

Keputusan berikut menutup celah pada PRD awal. Gunakan sebagai default.

| # | Topik | Keputusan |
|---|---|---|
| D1 | Catatan klarifikasi | Dua jenis terpisah: `client_question` (terlihat klien, per section) dan `internal_note` (hanya designer). |
| D2 | Edit saat klarifikasi | Klien hanya dapat mengedit **section yang ditandai** dan melihat `client_question` di section tersebut. |
| D3 | Notifikasi | Email transaksional **P0**: (a) designer saat klien submit, (b) klien saat ada klarifikasi, (c) klien saat link dikirim jika email klien ada. |
| D4 | Resume form | **P0**. Autosave per step ke server; klien melanjutkan dengan membuka link yang sama (state dikaitkan ke token + cookie perangkat). |
| D5 | Setelah submit | Klien melihat halaman Submitted (read-only ringkasan). Edit hanya terbuka bila status `needs_clarification`. |
| D6 | Setelah approved | Brief terkunci. Designer dapat **Reopen** → status `needs_clarification`; setiap reopen menaikkan `brief.version`. |
| D7 | Project type | Enum `graphic`, `uiux`, `both`. Untuk `both`, tampilkan kedua blok conditional berurutan. |
| D8 | Bahasa form klien | Per project: `id` (default) atau `en`. Teks UI disimpan di file i18n. |
| D9 | Completeness | Skor **P1**, tetapi struktur wajib/opsional field **P0** (Bagian 9) agar skor dapat ditambahkan nanti. |
| D10 | Pilihan "Not sure" | Dihitung **lengkap** (dijawab), ditampilkan di brief sebagai "Diserahkan ke designer", dan diberi badge netral. |
| D11 | Style Library | Set kartu sama untuk semua tipe project, tetapi tiap style punya **varian visual** `graphic` dan `uiux`; tampilkan varian sesuai `project.type` (untuk `both` pakai varian `graphic`). |
| D12 | Avoid | Klien dapat memilih style yang **tidak diinginkan** (Bagian 10) + teks bebas. |
| D13 | Monetisasi | Di luar scope MVP; tidak ada batas project. |

## 5. Scope & Prioritas

### P0 (MVP)

Auth designer · CRUD client · CRUD project · link berbagi (copy/disable/regenerate) · form klien progresif (Welcome, Audience, Visual Style, Mood, Preferences, Color, References, Content & Assets, Conditional, Review, Submitted) · upload file · autosave + resume · notifikasi email · dashboard designer · review (approve, needs clarification, designer interpretation, reopen) · approved brief view.

### P1

Requirement completeness score · link expiration · duplikasi project · export brief ke PDF · search & filter lanjutan · anotasi referensi lanjutan (multi-catatan) · analitik dashboard.

### P2

AI brief assistant · deteksi ambiguitas · rekomendasi style cerdas · deteksi konflik pilihan visual.

## 6. Arsitektur Informasi & Routes

### Designer app (terautentikasi)

| Route | Layar |
|---|---|
| `/login`, `/signup`, `/forgot-password` | Autentikasi |
| `/dashboard` | Overview, pending reviews, recent projects |
| `/projects` | Daftar project + search + filter status |
| `/projects/new` | Create Project |
| `/projects/:id` | Detail dengan tab: `overview`, `requirement`, `assets`, `review` (menjadi Approved Brief setelah approve) |
| `/clients`, `/clients/:id` | Daftar & detail client |
| `/settings` | Akun dan pengaturan |

### Client form (publik, via token)

| Route | Layar |
|---|---|
| `/c/:token` | Welcome |
| `/c/:token/audience` | Audience |
| `/c/:token/style` | Visual Style |
| `/c/:token/mood` | Mood |
| `/c/:token/preferences` | Visual Preferences & Avoid |
| `/c/:token/color` | Color |
| `/c/:token/references` | References |
| `/c/:token/content` | Content & Assets |
| `/c/:token/graphic`, `/c/:token/uiux` | Pertanyaan kondisional |
| `/c/:token/review` | Review |
| `/c/:token/submitted` | Submitted |

## 7. Lifecycle Status (State Machine)

`project.status` enum: `draft`, `sent`, `in_progress`, `submitted`, `needs_clarification`, `approved`.

| Dari | Ke | Pemicu | Aktor |
|---|---|---|---|
| `draft` | `sent` | Link digenerate/dikirim | Designer |
| `sent` | `in_progress` | Klien mengisi step pertama | Sistem |
| `in_progress` | `submitted` | Klien menekan Submit | Klien |
| `submitted` | `needs_clarification` | Designer meminta klarifikasi | Designer |
| `needs_clarification` | `submitted` | Klien mengirim ulang | Klien |
| `submitted` | `approved` | Designer menyetujui | Designer |
| `approved` | `needs_clarification` | Reopen (versi naik) | Designer |

Transisi lain **tidak valid** dan harus ditolak server (HTTP 409). Link dinonaktifkan: klien melihat halaman `link_disabled`, status tidak berubah.

## 8. Data Model

Relasi: `User 1—N Client 1—N Project 1—1 Brief`; `Brief 1—N Asset`, `Brief 1—N Reference`, `Brief 1—N Review`. Semua tabel punya `id (uuid)`, `created_at`, `updated_at`.

### `user`
`email` (unique), `password_hash` (nullable bila OAuth), `name`, `locale`.

### `client`
`user_id`, `name`, `company?`, `email?`, `phone?`.

### `project`
| Field | Tipe | Catatan |
|---|---|---|
| `client_id` | fk | |
| `name` | string | wajib |
| `type` | enum | `graphic`, `uiux`, `both` |
| `objective` | text | wajib |
| `deliverables` | string[] | wajib, min 1 |
| `deadline` | date? | |
| `language` | enum | `id`, `en` |
| `status` | enum | Bagian 7 |
| `share_token` | string unik | ≥ 32 karakter acak (crypto) |
| `link_enabled` | bool | default true |
| `link_expires_at` | timestamp? | P1 |

### `brief`
`project_id` (unique), `version` (int, default 1), `current_step` (string), `submitted_at?`, `reviewed_at?`, `approved_at?`.

```json
{
  "audience": { "target": "string", "age_range": "enum", "demographic": "string?", "desired_reaction": ["string"] },
  "visual_direction": {
    "styles": ["enum Style (max 3)"], "styles_undecided": false,
    "avoid_styles": ["enum Style"],
    "moods": ["enum Mood (max 3)"], "moods_undecided": false,
    "likes": ["enum Preference"], "avoid": ["enum Preference"], "avoid_note": "string?",
    "colors": { "mode": "enum", "palette": ["#hex"], "note": "string?" },
    "typography": "enum?"
  },
  "content": { "copy_status": "enum", "copy": "string?" },
  "output": { "graphic": {}, "uiux": {} },
  "designer_interpretation": "string?"
}
```

### `reference`
`brief_id`, `kind` (`image` | `url`), `url?`, `asset_id?`, `note?` (maks 500 karakter), `position`.

### `asset`
`brief_id`, `category` (enum Bagian 12), `file_name`, `mime_type`, `size_bytes`, `storage_key`, `status` (`uploading`, `ready`, `failed`).

### `review`
`brief_id`, `version`, `decision` (`needs_clarification` | `approved`), `internal_note?`, `created_at`. Tabel anak `review_question`: `review_id`, `section` (enum), `client_question`, `answered_at?`.

### `event` (analitik)
`project_id`, `name`, `step?`, `meta` (json), `created_at`.

## 9. Spesifikasi Form Klien

**Perilaku global:** satu pertanyaan utama per layar; progress bar; tombol Back/Next; autosave setiap perubahan (debounce 800 ms) dan saat pindah step; validasi inline; semua pilihan memiliki opsi **Not sure / No preference** bila relevan. Tombol Next dinonaktifkan hanya jika ada field wajib kosong.

Penanda: **W** = wajib, **O** = opsional.

### Step 1 — Welcome
Tampilkan nama project, perkiraan waktu (5–10 menit), nama designer, tombol **Get Started**. Info project (type, objective, deliverables, deadline) ditampilkan read-only, tidak ditanyakan ulang.

### Step 2 — Audience
| Field | Input | Aturan |
|---|---|---|
| `target` | teks pendek: "Siapa yang akan melihat/menggunakan desain ini?" | W, 3–200 karakter |
| `age_range` | single select: `<18`, `18-24`, `25-34`, `35-44`, `45-54`, `55+`, `mixed` | W |
| `demographic` | teks bebas (lokasi, profesi, minat) | O |
| `desired_reaction` | multi select (maks 3): `trust`, `excitement`, `calm`, `curiosity`, `confidence`, `joy`, `urgency`, `belonging` + Not sure | W |

### Step 3 — Visual Style
Pertanyaan: *What visual styles feel right for your project?* "Choose up to 3". Detail kartu di Bagian 10. W: pilih 1–3 style **atau** "Not sure — let the designer decide" (saling eksklusif). Teks opsional `style_note` (O): "Apa yang kamu suka dari pilihan ini?".

### Step 4 — Mood
Multi select maks 3 dari katalog Mood (Bagian 10) atau Not sure. W.

### Step 5 — Visual Preferences & Avoid
- `likes` (O): multi select dari katalog Preference.
- `avoid_styles` (O): pilih dari 8 style kartu (versi kompak) — "Gaya yang TIDAK kamu inginkan".
- `avoid` (O): multi select katalog Avoid + `avoid_note` teks bebas (maks 300).

### Step 6 — Color
`mode` (W): `brand_colors` (ikuti brand yang ada), `suggest` (designer yang menyarankan), `custom`. Jika `custom`: pilih hingga 5 warna hex via color picker + `note` (O). Opsional `typography` (O): `sans`, `serif`, `display`, `handwritten`, `not_sure`.

### Step 7 — References
Klien menambah hingga **6 referensi**: unggah gambar **atau** tempel URL (validasi `http/https`). Setiap referensi punya kolom `note`: "Apa yang kamu suka dari ini?" (O tetapi didorong). Referensi bersifat O, namun disarankan minimal 1; tampilkan hint non-memaksa. Fitur multi-catatan/anotasi gambar adalah P1.

### Step 8 — Content & Assets
- `copy_status` (W): `will_provide`, `in_preparation`, `need_help`. Jika `will_provide`, tampilkan textarea `copy` (O) atau arahkan upload dokumen.
- Checklist kategori aset (Bagian 12) dengan status per kategori: `provided`, `pending`, `not_applicable`. Tampilkan jelas apa yang sudah ada dan yang menyusul.

### Step 9 — Pertanyaan Kondisional
Bagian 11. Dilewati bila tidak relevan.

### Step 10 — Review
Tampilkan semua jawaban per section dengan tombol **Edit** yang kembali ke step terkait lalu langsung ke Review. Tombol **Submit** memvalidasi seluruh field W; bila ada yang kosong, scroll ke section pertama yang bermasalah.

### Step 11 — Submitted
Pesan sukses, ringkasan singkat, info bahwa designer akan menghubungi. Read-only.

## 10. Katalog Visual (Style, Mood, Preference)

### 10.1 Visual Style Library

Kartu image-led. Anatomi: **preview visual → nama → deskripsi singkat → state terpilih**. Terpilih: border primary, ikon centang, tint `Soft Accent`. Maks 3 pilihan; setelah 3, kartu lain nonaktif dengan tooltip.

| `id` | Nama | Deskripsi klien | Tag internal |
|---|---|---|---|
| `minimal` | Minimal | Bersih, sederhana & fokus | clean, whitespace, restrained, focused |
| `modern` | Modern | Kontemporer, rapi & halus | contemporary, refined, polished |
| `bold` | Bold | Kuat, ekspresif & berdampak | expressive, high-impact, strong type |
| `premium` | Premium | Canggih, elegan & mewah | luxury, high-end, sophisticated |
| `playful` | Playful | Seru, ekspresif & enerjik | fun, colorful, friendly, energetic |
| `corporate` | Corporate | Profesional, terstruktur & tepercaya | professional, enterprise, structured |
| `editorial` | Editorial | Berbasis tipografi, canggih & ekspresif | magazine, typography-led, art-directed |
| `futuristic` | Futuristic | Inovatif, digital & berpandangan ke depan | technology, digital, experimental |

Kartu harus memakai **komposisi visual beragam** (poster, kemasan, logo, layout web, layar mobile), bukan hanya screenshot website. Aset kartu disimpan di `/public/styles/{id}-{graphic|uiux}.webp` (placeholder diperbolehkan pada tahap awal).

### 10.2 Mood (maks 3)
`trustworthy`, `sophisticated`, `friendly`, `energetic`, `calm`, `luxurious`, `bold`, `warm`, `serious`, `innovative`, `youthful`, `timeless`.

### 10.3 Preference (`likes` dan `avoid`)
`whitespace`, `strong_typography`, `clean_layout`, `rich_imagery`, `illustration`, `bright_colors`, `muted_colors`, `dark_theme`, `rounded_shapes`, `sharp_geometry`, `animation`, `dense_information`, `too_corporate`, `too_dark`, `too_playful`, `too_busy`.

## 11. Logika Kondisional

Blok ditentukan oleh `project.type`; `both` menampilkan keduanya.

### Graphic Design (`output.graphic`)
- `usage` (W, multi): `instagram`, `linkedin`, `website`, `print`, `billboard`, `presentation`, `advertisement`, `other`.
- Jika `instagram`/`linkedin`: `social_format` (W): `feed`, `story`, `carousel`.
- Jika `print`: `print_size` (W teks, mis. A4) dan `orientation` (W): `portrait`, `landscape`.
- `final_formats` (O): `png`, `jpg`, `pdf`, `svg`, `ai`.

### UI/UX Design (`output.uiux`)
- `design_target` (W): `website`, `web_app`, `mobile_app`, `dashboard`, `saas`, `other`.
- `platforms` (W, multi): `desktop`, `mobile`, `tablet`.
- `existing_product` (W bool). Jika true: `product_url` (W), screenshot/existing design (O, upload).
- `design_system` (W): `full`, `some_components`, `none`, `not_sure`.
- `final_formats` (O): `figma`, `png`, `pdf`.

## 12. Aset & Uploader

**Kategori `asset.category`:** `logo`, `brand_guideline`, `brand_colors`, `brand_fonts`, `existing_design`, `product_images`, `icons`, `illustrations`, `other`, `reference_image`.

**Uploader universal:** drag-and-drop dan browse (di ponsel: kamera/galeri). Tampilkan progress, status sukses/gagal, nama file, tipe file, tombol hapus/coba ulang.

**Batasan (default, dapat dikonfigurasi via env):**

| Parameter | Nilai |
|---|---|
| Format diizinkan | JPG, PNG, WEBP, SVG, PDF, FIG, ZIP |
| Ukuran maks per file | 25 MB |
| Total per project | 200 MB |
| Jumlah file per project | 40 |
| Validasi | MIME dan ekstensi di server; tolak yang tidak cocok; SVG disanitasi |

File disimpan di object storage privat; akses lewat signed URL berumur pendek. Ini **alat pengumpul aset**, bukan DAM.

## 13. Spesifikasi Aplikasi Designer

### Dashboard
Kartu ringkas: jumlah `submitted` (pending review), `needs_clarification`, `in_progress`; daftar project terbaru; tombol **New Project**.

### Daftar Project
Kolom: nama project, client, type, ringkasan style, status (badge), tanggal submit. Search (nama project/client) dan filter status **P0**.

### Create Project
Form: pilih/buat client, `name`, `type`, `objective`, `deliverables`, `deadline`, `language`. Setelah simpan → generate link; tombol **Copy link**, **Disable**, **Regenerate** (regenerate membatalkan token lama).

### Detail Project
Tab `overview` (data project + link), `requirement` (jawaban klien per section, read-only, rapi dan mudah dipindai), `assets` (galeri/daftar), `review`.

### Review
- **Approve Brief:** hanya dari `submitted`; mengisi `approved_at`.
- **Needs Clarification:** pilih section terdampak, tulis `client_question` per section (wajib minimal 1), `internal_note` opsional. Kirim email ke klien (bila ada).
- **Designer Interpretation:** textarea internal; dapat disimpan kapan saja, tidak terlihat klien.
- **Reopen:** dari `approved`.

### Requirement Completeness (P1)
Indikator persentase + rincian per section (✓ / ⚠). Alat bantu keputusan designer, **bukan** skor untuk klien. Bobot disarankan: Audience 20, Visual Direction 30, References 15, Content & Assets 20, Output 15. "Not sure" dihitung terisi.

## 14. Final Design Brief

Halaman bersih, dapat dipindai < 5 menit, ditampilkan di `/projects/:id` tab review setelah approve.

| Section | Isi |
|---|---|
| Objective | `project.objective` |
| Audience | target, usia, demografi, reaksi yang diinginkan |
| Visual Direction | style · mood (chip); style yang dihindari |
| Preferences | likes (chip) |
| Avoid | avoid + catatan |
| Color & Typography | palet/mode, tipografi |
| References | thumbnail/URL + catatan klien |
| Content | status copy + teks |
| Assets | daftar per kategori + status (provided/pending) |
| Output | blok graphic dan/atau uiux |
| Deadline | `project.deadline` |
| Designer Interpretation | catatan designer (ditandai internal) |

Export PDF dan duplikasi project adalah **P1**.

## 15. Notifikasi Email (P0)

| Pemicu | Penerima | Isi |
|---|---|---|
| Link dikirim (opsional) | Klien | Tautan form dan nama designer |
| Klien submit | Designer | Nama project/client dan tautan ke review |
| Needs clarification | Klien | Daftar `client_question` dan tautan form |
| Klien kirim ulang | Designer | Tautan ke review |

Penyedia email bebas (mis. Resend/Postmark). Template ringkas, mengikuti design system.

## 16. Keamanan & Privasi

- Token project acak kriptografis ≥ 32 karakter; tidak dapat ditebak dan tidak memuat ID berurutan.
- Klien hanya dapat mengakses data project dari tokennya; semua query server difilter berdasarkan token.
- Designer hanya dapat mengakses data miliknya (cek `user_id` di setiap query).
- Link dapat di-disable, di-regenerate (P0) dan kedaluwarsa (P1).
- Rate limiting pada endpoint publik dan upload.
- Password di-hash (argon2/bcrypt); sesi memakai cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Halaman form klien menampilkan pernyataan singkat bahwa file hanya dipakai untuk project ini.
- Designer dapat menghapus client/project beserta seluruh file (hard delete) dari aplikasi.
- `noindex` pada semua route `/c/*`.

## 17. Design System — Soft Editorial Intelligence

**Kata kunci:** airy, minimal, warm, premium, creative, soft-tech, editorial. **Hindari:** generic SaaS, dashboard berat, dark-mode-first, terlalu futuristik, biru korporat, gradien berlebihan, glassmorphism di mana-mana.

### Warna
| Token | Nilai | Pemakaian |
|---|---|---|
| `--bg` | `#F7F8F5` | Latar halaman |
| `--surface` | `#FFFFFF` | Kartu, panel, form |
| `--primary` | `#B7EF2A` | CTA, state aktif, highlight (**hanya sebagai fill; teks di atasnya memakai `--ink`**) |
| `--ink` | `#172019` | Teks utama, navigasi |
| `--muted` | `#6F756F` | Teks pendukung |
| `--border` | `#E7EAE4` | Garis & batas |
| `--soft-accent` | `#EFF9D6` | Permukaan terpilih/disorot |
| `--success` | `#4D9B62` | Sukses |
| `--warning` | `#D99A28` | Perhatian |
| `--danger` | `#D85C5C` | Error/destruktif |

### Bentuk
| Komponen | Radius |
|---|---|
| App shell | 24px |
| Large card | 20px |
| Card | 16px |
| Input, Button | 12px |
| Upload zone | 16px |
| Pill | 999px |

### Tipografi
Manrope (fallback Inter). Skala: Display 64/1.05, H1 40/1.1, H2 32/1.15, H3 24/1.2, Body Large 18/1.5, Body 15–16/1.5, Caption 13/1.4. Pada layar kecil, skala Display/H1 diperkecil secara proporsional.

### Karakter visual
Latar ambient dengan radial glow lime/hijau sangat halus; app shell membulat besar; ruang putih lega; grid halus hanya di hero/dashboard; kontrol berbentuk pill untuk navigasi kompak; ikon minimal; border tipis; heading editorial berukuran besar. Lime sebagai warna perhatian, bukan warna latar dominan.

### Kepribadian form klien
Seperti onboarding premium, bukan Google Forms: tipografi besar, spasi lega, satu pertanyaan per layar, pilihan visual, latar lembut, kartu membulat, progres jelas, minim distraksi.

### Komponen minimum
Button (primary/secondary/ghost), Input, Textarea, Select, Chip/Pill, Style Card, Mood Chip, Upload Zone & File Row, Progress Bar, Status Badge (6 status), Stepper, Toast, Empty State, Skeleton/Loading, Error State, Modal/Confirm.

## 18. Aksesibilitas, Responsif, Bahasa

- **Mobile-first untuk klien** (target viewport 360px). Desktop mengikuti. Sisi designer responsif, tetapi dioptimalkan untuk desktop/tablet.
- Target kontras WCAG AA; jangan memakai `--primary` sebagai warna teks pada latar terang.
- Navigasi keyboard penuh; kartu style berperan sebagai radio/checkbox dengan `aria-pressed`/label yang jelas; fokus terlihat.
- Hormati `prefers-reduced-motion`.
- Semua teks UI melalui lapisan i18n (`id`, `en`); tanggal dan angka mengikuti locale.

## 19. Analitik & Metrik Sukses

**Event yang dicatat (P0, ke tabel `event`):** `form_opened`, `step_viewed`, `step_completed`, `form_submitted`, `upload_started`, `upload_failed`, `clarification_requested`, `brief_approved`.

| Metrik | Definisi | Target |
|---|---|---|
| Brief completion rate | `form_submitted` ÷ `form_opened` pertama (unik per project) | > 80% |
| Form abandonment | Project dibuka tapi tidak submit dalam 7 hari | < 20% |
| Clarification rate | Project dengan ≥ 1 `clarification_requested` ÷ project submit | Semakin rendah semakin baik |
| Completion time | Selisih `form_opened` pertama ke `form_submitted` (median) | 5–10 menit |
| Waktu memahami brief | Survei singkat designer atau waktu di halaman brief | < 5 menit |
| Kepuasan designer | Survei 1–5: "Brief ini mengurangi pertanyaan lanjutan" | ≥ 4 |
| First-pass approval | Approved tanpa putaran klarifikasi | Dipantau (baseline dulu) |

## 20. Acceptance Criteria (P0)

| ID | Kriteria |
|---|---|
| AC-01 | Designer dapat daftar/login (email+password atau Google) dan hanya melihat datanya sendiri. |
| AC-02 | Designer dapat membuat client dan project dengan field wajib; project baru berstatus `draft`. |
| AC-03 | Generate link menghasilkan token unik; status menjadi `sent`; link dapat disalin, di-disable, dan di-regenerate (token lama berhenti bekerja). |
| AC-04 | Klien dapat membuka link tanpa akun; token tidak valid/nonaktif menampilkan halaman error tanpa membocorkan data. |
| AC-05 | Form menampilkan satu pertanyaan utama per layar dengan progress bar; field wajib divalidasi inline. |
| AC-06 | Pilihan style dibatasi maks 3; "Not sure" saling eksklusif dengan pilihan style. |
| AC-07 | Blok kondisional tampil sesuai `project.type`, termasuk sub-pertanyaan social/print dan existing product. |
| AC-08 | Jawaban tersimpan otomatis; menutup tab lalu membuka link yang sama melanjutkan dari step terakhir dengan data utuh. |
| AC-09 | Upload menampilkan progress/sukses/gagal; file di luar batasan ditolak dengan pesan jelas. |
| AC-10 | Halaman Review menampilkan semua jawaban dengan aksi Edit; Submit mengubah status menjadi `submitted` dan mengirim email ke designer. |
| AC-11 | Designer dapat melihat submission per section, menambah/ubah Designer Interpretation, dan Approve; status menjadi `approved`. |
| AC-12 | Needs Clarification mewajibkan ≥ 1 section + `client_question`; klien menerima email dan hanya dapat mengedit section ditandai; kirim ulang → `submitted`. |
| AC-13 | Transisi status tidak valid ditolak (409); brief approved bersifat read-only hingga Reopen. |
| AC-14 | Brief approved menampilkan semua section Bagian 14 dan terbaca rapi di desktop dan mobile. |
| AC-15 | Form klien dapat dipakai penuh di viewport 360px, termasuk upload dari kamera/galeri. |
| AC-16 | Event analitik pada Bagian 19 tercatat. |

## 21. Rekomendasi Teknis & Urutan Build

### Stack (saran, dapat diganti)
Next.js (App Router) + TypeScript · Tailwind CSS · PostgreSQL + Prisma · penyimpanan objek S3-compatible (mis. Cloudflare R2/Supabase Storage) · Auth.js (email+password, Google) · Zod untuk validasi bersama client/server · layanan email transaksional · i18n (`next-intl`).

### Urutan build
1. **Fondasi:** setup proyek, design tokens, komponen dasar, skema database, auth designer.
2. **Designer — data inti:** CRUD client & project, generate/disable/regenerate link.
3. **Client form (Sprint 01):** Welcome → Audience → Style → Mood → Preferences → Color → References → Content & Assets → Review → Submitted, dengan autosave, resume, dan uploader.
4. **Conditional experience (Sprint 04):** blok Graphic dan UI/UX, tipe `both`.
5. **Designer review (Sprint 02):** dashboard, daftar project, detail, review, clarification, approve, reopen, Approved Brief.
6. **Notifikasi email & analitik event.**
7. **Polish (Sprint 05):** animasi, empty/loading/error state, aksesibilitas, QA responsif.

### Struktur API (ringkas)
- Designer: `POST /api/projects`, `GET /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `POST /api/projects/:id/link/regenerate`, `POST /api/projects/:id/link/disable`, `POST /api/projects/:id/review` (`approve` | `clarify` | `reopen`), `PATCH /api/projects/:id/interpretation`.
- Klien (token): `GET /api/c/:token`, `PATCH /api/c/:token/brief` (autosave per section), `POST /api/c/:token/assets`, `DELETE /api/c/:token/assets/:id`, `POST /api/c/:token/submit`.

## 22. Asumsi, Risiko, Open Questions

### Asumsi
- Klien mau mengisi form 5–10 menit jika pengalamannya ringan dan visual.
- Designer bersedia berpindah dari Google Form/Notion bila brief hasilnya lebih rapi.
- Pasar awal berbahasa Indonesia; klien membuka link dari WhatsApp di ponsel.

### Risiko
| Risiko | Mitigasi |
|---|---|
| Produksi aset kartu style butuh waktu dan kurasi | Mulai dengan placeholder berkualitas; uji ke klien nyata sebelum finalisasi |
| Style "Modern" dan "Premium" tumpang tindih | Uji pemahaman klien; perjelas deskripsi atau contoh visual |
| Klien meninggalkan form di tengah | Autosave, resume, form singkat, progress jelas |
| File upload berukuran besar/berbahaya | Batas ukuran, validasi tipe, sanitasi SVG, signed URL |

### Open questions (keputusan default tetap berlaku sampai diubah)
- Apakah perlu batas jumlah project per akun (paket gratis/berbayar)?
- Apakah klien perlu menerima salinan jawaban via email setelah submit?
- Kebijakan retensi file setelah project `approved` (default: disimpan sampai dihapus designer).

### Validasi sebelum/selama build
Wawancarai 5–8 freelance designer dan uji prototipe form dengan beberapa klien non-desainer sebelum finalisasi katalog style/mood.

---

**Produk bukan sekadar form requirement.** Ia adalah jembatan terstruktur antara bahasa visual subjektif klien dan workflow praktis designer: **Client → Guided Visual UX → Structured Data → Designer Review → Designer Interpretation → Design Brief → Start Design.**
