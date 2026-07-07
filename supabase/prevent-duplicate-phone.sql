-- Jalankan bagian cek ini lebih dulu untuk melihat nomor telepon yang sudah terdaftar lebih dari satu kali.
select
  phone,
  count(*) as total,
  string_agg(full_name, ', ' order by created_at) as peserta
from registrations
group by phone
having count(*) > 1
order by total desc, phone;

-- Setelah data duplikat dirapikan admin, jalankan baris ini untuk mengunci database:
create unique index if not exists registrations_phone_unique_idx on registrations(phone);
