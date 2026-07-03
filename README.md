# HY Birthday Run 58 App

Aplikasi pendaftaran lengkap untuk HY Birthday Run 58.

## Stack

- Next.js untuk aplikasi dan API
- Supabase untuk database dan file upload
- Resend untuk email otomatis
- Vercel untuk deployment

## Fitur

- Halaman publik acara
- Form pendaftaran Offline dan Virtual 5,8KM
- Upload bukti pembayaran
- Email otomatis setelah daftar
- Link unik peserta tanpa login
- Status pembayaran, BIB, resi pengiriman
- Upload bukti lari virtual
- Admin satu akun
- Verifikasi pembayaran
- BIB otomatis setelah verifikasi
- Input resi pengiriman
- Approval bukti lari virtual
- Email finisher confirmed
- Export CSV dari admin

## Setup Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan isi file `supabase/schema.sql`.
4. Ambil `Project URL`, `anon key`, dan `service_role key`.

## Setup Resend

1. Buat akun Resend.
2. Verifikasi domain pengirim.
3. Buat API key.
4. Gunakan alamat pengirim di `EMAIL_FROM`.

## Environment Variables

Salin `.env.example` menjadi `.env.local` untuk development, dan isi variable yang sama di Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://domain-kamu.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key
EMAIL_FROM=HY Birthday Run <noreply@domain-kamu.com>
ADMIN_PASSWORD=password-admin
```

## Jalankan Lokal

```bash
npm install
npm run dev
```

## Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Import repo di Vercel.
3. Isi environment variables.
4. Deploy.

## Catatan Produksi

- Jangan pernah memasukkan `SUPABASE_SERVICE_ROLE_KEY` ke browser.
- Gunakan password admin yang kuat.
- Setelah nomor rekening final, update tampilan rekening dan setting database.
- Untuk email yang stabil, gunakan domain yang sudah diverifikasi di Resend.
