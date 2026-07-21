-- Jalankan sekali di Supabase SQL Editor sebelum memakai form pendaftaran versi baru.
-- Kolom dibuat nullable agar data peserta lama tetap aman.

alter table registrations
add column if not exists ktp_number text;

alter table registrations
add column if not exists blood_type text;
