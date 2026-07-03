"use client";

import { useMemo, useState } from "react";
import { categoryPrices, defaultSettings, formatRupiah } from "@/lib/config";
import type { Category } from "@/lib/types";

const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"];

export default function RegisterForm({ initialCategory }: { initialCategory: Category }) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [message, setMessage] = useState("");
  const [participantUrl, setParticipantUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = useMemo(() => categoryPrices[category], [category]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setParticipantUrl("");

    const formData = new FormData(event.currentTarget);
    formData.set("category", category);

    const response = await fetch("/api/registrations", {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error || "Pendaftaran belum berhasil. Coba lagi.");
      return;
    }

    setParticipantUrl(result.participantUrl || "");
    setMessage("Pendaftaran diterima. Simpan link unik peserta di bawah ini.");
    event.currentTarget.reset();
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit}>
      <label>
        Kategori
        <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
          <option value="Offline">Offline Run 5,8KM</option>
          <option value="Virtual">Virtual Run 5,8KM</option>
        </select>
      </label>

      <div className="two-col">
        <label>Nama lengkap <input required name="full_name" placeholder="Nama lengkap (Nama panggilan)" /></label>
        <label>Email aktif <input required name="email" type="email" placeholder="nama@email.com" /></label>
      </div>
      <div className="two-col">
        <label>Nomor telepon <input required name="phone" type="tel" placeholder="08xxxxxxxxxx" /></label>
        <label>Tanggal lahir <input required name="birth_date" type="date" /></label>
      </div>
      <div className="two-col">
        <label>Jenis kelamin
          <select required name="gender">
            <option>Perempuan</option>
            <option>Laki-laki</option>
          </select>
        </label>
        <label>Kota domisili <input required name="domicile_city" placeholder="Jakarta Selatan" /></label>
      </div>

      {category === "Offline" ? (
        <div className="conditional-fields">
          <div className="two-col">
            <label>Nama kontak emergency <input required name="emergency_name" /></label>
            <label>Nomor emergency <input required name="emergency_phone" type="tel" /></label>
          </div>
          <label>Hubungan dengan kontak emergency <input required name="emergency_relation" placeholder="Suami/Istri, Kakak/Adik, Teman" /></label>
        </div>
      ) : (
        <div className="conditional-fields">
          <label>Nama akun aplikasi lari <input required name="running_app_account" placeholder="Nama akun Strava/Garmin/aplikasi lain" /></label>
        </div>
      )}

      <div className="two-col">
        <label>Size jersey/kaos
          <select required name="shirt_size">
            {shirtSizes.map((size) => <option key={size}>{size}</option>)}
          </select>
        </label>
        <label>Bukti pembayaran <input required name="payment_proof" type="file" accept="image/*,.pdf" /></label>
      </div>

      <label>Alamat lengkap <textarea required name="address" placeholder="Alamat lengkap pengiriman" /></label>
      <div className="three-col">
        <label>Kelurahan <input required name="village" /></label>
        <label>Kecamatan <input required name="district" /></label>
        <label>Kota/Kabupaten <input required name="city_regency" /></label>
      </div>
      <div className="three-col">
        <label>Provinsi <input required name="province" /></label>
        <label>Kode pos <input required name="postal_code" /></label>
        <label>Catatan alamat <input name="address_notes" placeholder="Patokan, warna pagar, dll." /></label>
      </div>

      <div className="size-chart">
        <strong>Size chart</strong>
        <div className="size-row">{shirtSizes.map((size) => <span key={size}>{size}</span>)}</div>
        <small>Ukuran detail dapat diedit admin ketika chart resmi sudah tersedia.</small>
      </div>

      <label className="check-row"><input required name="truth_consent" type="checkbox" /> Data yang saya isi benar.</label>
      <label className="check-row"><input required name="address_consent" type="checkbox" /> Saya memahami kesalahan alamat dan nomor telepon menjadi tanggung jawab peserta.</label>
      <label className="check-row"><input required name="health_consent" type="checkbox" /> Saya mengikuti acara dalam kondisi sehat dan memahami risiko pribadi.</label>

      <div className="form-total">
        <span>Total pembayaran</span>
        <strong>{formatRupiah(total)}</strong>
      </div>
      <p className="muted">Transfer ke rekening {defaultSettings.bankName} {defaultSettings.bankAccountNumber} a/n {defaultSettings.accountHolder}.</p>
      <button className="button primary full" disabled={submitting} type="submit">{submitting ? "Mengirim..." : "Submit Pendaftaran"}</button>
      {message ? <p className="form-message">{message}</p> : null}
      {participantUrl ? <a className="button secondary full" href={participantUrl}>Buka link unik peserta</a> : null}
    </form>
  );
}
