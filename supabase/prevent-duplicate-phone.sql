-- Jalankan file ini setelah data dobel yang tidak valid sudah diberi status rejected.
-- Tujuannya: satu nomor HP hanya boleh punya satu pendaftaran aktif.
-- Pendaftaran dengan status rejected tidak ikut mengunci nomor HP.

update registrations
set phone = regexp_replace(phone, '\D', '', 'g')
where phone is not null;

update registrations
set emergency_phone = regexp_replace(emergency_phone, '\D', '', 'g')
where emergency_phone is not null;

drop index if exists registrations_phone_unique_idx;

do $$
begin
  if exists (
    select 1
    from registrations
    where payment_status <> 'rejected'
      and phone is not null
      and phone <> ''
    group by phone
    having count(*) > 1
  ) then
    raise exception 'Masih ada nomor HP dobel yang statusnya belum rejected. Reject data dobel dulu, lalu jalankan file ini lagi.';
  end if;
end $$;

create unique index registrations_phone_unique_idx
on registrations(phone)
where payment_status <> 'rejected' and phone is not null and phone <> '';

-- Cek hasil akhir. Jika tidak ada baris keluar, aturan nomor HP sudah aman.
select
  phone,
  count(*) as total,
  string_agg(full_name, ', ' order by created_at) as peserta
from registrations
where payment_status <> 'rejected'
  and phone is not null
  and phone <> ''
group by phone
having count(*) > 1
order by total desc, phone;
