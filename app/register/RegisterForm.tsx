"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, formatRupiah, getRegistrationTotal, getShirtSurcharge, premiumShirtFee, shirtSizes } from "@/lib/config";
import { fallbackProvinces, postalCodeApiUrl, regionApiBaseUrl, type RegionOption } from "@/lib/indonesia-regions";
import type { Category } from "@/lib/types";

export default function RegisterForm({ initialCategory }: { initialCategory: Category }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<Category>(initialCategory);
  const [shirtSize, setShirtSize] = useState("M");
  const [message, setMessage] = useState("");
  const [participantUrl, setParticipantUrl] = useState("");
  const [participantCode, setParticipantCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [provinces, setProvinces] = useState<RegionOption[]>(fallbackProvinces);
  const [regencies, setRegencies] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [villages, setVillages] = useState<RegionOption[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [regencyId, setRegencyId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [cityRegency, setCityRegency] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [postalCodeStatus, setPostalCodeStatus] = useState("");
  const [registrationWindow, setRegistrationWindow] = useState<"checking" | "open" | "not-open" | "closed">("checking");
  const shirtSurcharge = useMemo(() => getShirtSurcharge(shirtSize), [shirtSize]);
  const total = useMemo(() => getRegistrationTotal(category, shirtSize), [category, shirtSize]);

  useEffect(() => {
    function updateRegistrationWindow() {
      const now = Date.now();
      const opensAt = Date.parse(defaultSettings.registrationOpensAt);
      const closesAt = Date.parse(defaultSettings.registrationClosesAt);

      if (now < opensAt) {
        setRegistrationWindow("not-open");
      } else if (now > closesAt) {
        setRegistrationWindow("closed");
      } else {
        setRegistrationWindow("open");
      }
    }

    updateRegistrationWindow();
    const timer = window.setInterval(updateRegistrationWindow, 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (formRef.current) updateFormReady(formRef.current);
  }, [category, shirtSize, provinceId, regencyId, districtId, village, postalCode]);

  useEffect(() => {
    loadRegions(`${regionApiBaseUrl}/provinces.json`, fallbackProvinces).then(setProvinces);
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    loadRegions(`${regionApiBaseUrl}/regencies/${provinceId}.json`, []).then(setRegencies);
  }, [provinceId]);

  useEffect(() => {
    if (!regencyId) return;
    loadRegions(`${regionApiBaseUrl}/districts/${regencyId}.json`, []).then(setDistricts);
  }, [regencyId]);

  useEffect(() => {
    if (!districtId) return;
    loadRegions(`${regionApiBaseUrl}/villages/${districtId}.json`, []).then(setVillages);
  }, [districtId]);

  function updateFormReady(form: HTMLFormElement) {
    window.setTimeout(() => setFormReady(form.checkValidity()), 0);
  }

  function keepPhoneDigits(event: React.FormEvent<HTMLInputElement>) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 12);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setParticipantUrl("");
    setParticipantCode("");

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
    setParticipantCode(result.participantCode || "");
    setMessage("Pendaftaran HY Birthday Run 58 telah berhasil. Simpan link unik peserta di bawah ini.");
    event.currentTarget.reset();
    setShirtSize("M");
    setCityRegency("");
    setDistrict("");
    setVillage("");
    setProvince("");
    setPostalCode("");
    setProvinceId("");
    setRegencyId("");
    setDistrictId("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    setPostalCodeStatus("");
    setFormReady(false);
  }

  function handleProvinceChange(nextProvinceId: string) {
    const selected = provinces.find((item) => item.id === nextProvinceId);
    setProvinceId(nextProvinceId);
    setProvince(selected?.name || "");
    setRegencyId("");
    setDistrictId("");
    setCityRegency("");
    setDistrict("");
    setVillage("");
    setPostalCode("");
    setPostalCodeStatus("");
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
  }

  function handleRegencyChange(nextRegencyId: string) {
    const selected = regencies.find((item) => item.id === nextRegencyId);
    setRegencyId(nextRegencyId);
    setCityRegency(selected?.name || "");
    setDistrictId("");
    setDistrict("");
    setVillage("");
    setPostalCode("");
    setPostalCodeStatus("");
    setDistricts([]);
    setVillages([]);
  }

  function handleDistrictChange(nextDistrictId: string) {
    const selected = districts.find((item) => item.id === nextDistrictId);
    setDistrictId(nextDistrictId);
    setDistrict(selected?.name || "");
    setVillage("");
    setPostalCode("");
    setPostalCodeStatus("");
    setVillages([]);
  }

  async function handleVillageChange(nextVillage: string) {
    setVillage(nextVillage);
    setPostalCode("");
    setPostalCodeStatus("Mencari kode pos...");
    const nextPostalCode = await findPostalCode([nextVillage, district, cityRegency, province]);
    if (nextPostalCode) {
      setPostalCode(nextPostalCode);
      setPostalCodeStatus("Kode pos terisi otomatis.");
    } else {
      setPostalCodeStatus("Kode pos belum ditemukan otomatis, silakan isi manual.");
    }
  }

  if (registrationWindow !== "open") {
    const isChecking = registrationWindow === "checking";
    const isClosed = registrationWindow === "closed";

    return (
      <section className="registration-form registration-lock" aria-live="polite">
        <span className="pill">{isChecking ? "Mengecek waktu" : isClosed ? "Pendaftaran ditutup" : "Pendaftaran belum dibuka"}</span>
        <h2>{isChecking ? "Mohon tunggu sebentar." : isClosed ? "Pendaftaran sudah ditutup." : "Pendaftaran dibuka hari ini pukul 16.00 WIB."}</h2>
        <p>
          {isChecking
            ? "Sistem sedang mengecek periode pendaftaran."
            : isClosed
              ? "Terima kasih atas antusiasmenya. Sistem sudah tidak menerima pendaftaran baru."
              : "Silakan kembali lagi mulai 7 Juli 2026 pukul 16.00 WIB untuk mengisi data pendaftaran."}
        </p>
      </section>
    );
  }

  return (
    <form
      ref={formRef}
      className="registration-form"
      onInput={(event) => updateFormReady(event.currentTarget)}
      onChange={(event) => updateFormReady(event.currentTarget)}
      onSubmit={handleSubmit}
    >
      <label>
        Kategori
        <select value={category} onChange={(event) => {
          setCategory(event.target.value as Category);
          setFormReady(false);
        }}>
          <option value="Offline">Offline Run 5,8KM</option>
          <option value="Virtual">Virtual Run 5,8KM</option>
        </select>
      </label>

      <div className="two-col">
        <label>Nama lengkap <input required name="full_name" placeholder="Nama lengkap (Nama panggilan)" /></label>
        <label>Email aktif <input required name="email" type="email" placeholder="nama@email.com" /></label>
      </div>
      <div className="two-col">
        <label>Nomor telepon
          <input
            required
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="0[0-9]{9,11}"
            minLength={10}
            maxLength={12}
            onInput={keepPhoneDigits}
            title="Nomor telepon harus diawali 0 dan berisi angka 10-12 digit."
            placeholder="08xxxxxxxxxx"
          />
        </label>
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
            <label>Nomor emergency
              <input
                required
                name="emergency_phone"
                type="tel"
                inputMode="numeric"
                pattern="0[0-9]{9,11}"
                minLength={10}
                maxLength={12}
                onInput={keepPhoneDigits}
                title="Nomor telepon harus diawali 0 dan berisi angka 10-12 digit."
                placeholder="08xxxxxxxxxx"
              />
            </label>
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
          <select required name="shirt_size" value={shirtSize} onChange={(event) => setShirtSize(event.target.value)}>
            {shirtSizes.map((size) => <option key={size}>{size}</option>)}
          </select>
        </label>
        <label>Bukti pembayaran <input required name="payment_proof" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" /></label>
      </div>

      <label>Alamat lengkap <textarea required name="address" placeholder="Alamat lengkap pengiriman" /></label>
      <div className="three-col">
        <label>Provinsi
          <select required value={provinceId} onChange={(event) => handleProvinceChange(event.target.value)}>
            <option value="">Pilih provinsi</option>
            {provinces.map((item) => <option key={item.id} value={item.id}>{toTitleCase(item.name)}</option>)}
          </select>
          <input type="hidden" name="province" value={province} />
        </label>
        <label>Kota/Kabupaten
          <select required value={regencyId} onChange={(event) => handleRegencyChange(event.target.value)} disabled={!provinceId}>
            <option value="">{provinceId ? "Pilih kota/kabupaten" : "Pilih provinsi dulu"}</option>
            {regencies.map((item) => <option key={item.id} value={item.id}>{toTitleCase(item.name)}</option>)}
          </select>
          <input type="hidden" name="city_regency" value={cityRegency} />
        </label>
        <label>Kecamatan
          <select required value={districtId} onChange={(event) => handleDistrictChange(event.target.value)} disabled={!regencyId}>
            <option value="">{regencyId ? "Pilih kecamatan" : "Pilih kota dulu"}</option>
            {districts.map((item) => <option key={item.id} value={item.id}>{toTitleCase(item.name)}</option>)}
          </select>
          <input type="hidden" name="district" value={district} />
        </label>
      </div>
      <div className="three-col">
        <label>Kelurahan
          <select required value={village} onChange={(event) => handleVillageChange(event.target.value)} disabled={!districtId}>
            <option value="">{districtId ? "Pilih kelurahan" : "Pilih kecamatan dulu"}</option>
            {villages.map((item) => <option key={item.id} value={item.name}>{toTitleCase(item.name)}</option>)}
          </select>
          <input type="hidden" name="village" value={village} />
        </label>
        <label>Kode pos
          <input
            required
            name="postal_code"
            value={postalCode}
            onChange={(event) => {
              setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 5));
              setPostalCodeStatus("");
            }}
            inputMode="numeric"
            pattern="[0-9]{5}"
            minLength={5}
            maxLength={5}
            title="Kode pos harus 5 digit angka."
            autoComplete="postal-code"
          />
          {postalCodeStatus ? <small>{postalCodeStatus}</small> : null}
        </label>
        <label>Catatan alamat <input name="address_notes" placeholder="Patokan, warna pagar, dll." /></label>
      </div>

      <div className="size-chart">
        <strong>Size chart</strong>
        <img className="size-chart-image" src="/jersey-size-chart.png" alt="Size chart jersey HY Birthday Run" />
        <small>Pilihan ukuran tersedia dari 3XS sampai 5XL. Size 3XL, 4XL, dan 5XL dikenakan tambahan {formatRupiah(premiumShirtFee)}.</small>
        <small>Semua ukuran dalam centimeter, toleransi manual 1 - 1,5 cm.</small>
      </div>

      <label className="check-row"><input required name="truth_consent" type="checkbox" /> Data yang saya isi benar.</label>
      <label className="check-row"><input required name="address_consent" type="checkbox" /> Saya memahami kesalahan alamat dan nomor telepon menjadi tanggung jawab peserta.</label>
      <label className="check-row"><input required name="health_consent" type="checkbox" /> Saya mengikuti acara dalam kondisi sehat dan memahami risiko pribadi.</label>

      <div className="form-total">
        <span>Total pembayaran</span>
        <strong>{formatRupiah(total)}</strong>
      </div>
      {shirtSurcharge > 0 ? <p className="muted">Termasuk tambahan size {shirtSize}: {formatRupiah(shirtSurcharge)}.</p> : null}
      <p className="muted">Transfer ke rekening {defaultSettings.bankName} {defaultSettings.bankAccountNumber} a/n {defaultSettings.accountHolder}.</p>
      <button className="button primary full" disabled={submitting || !formReady} type="submit">{submitting ? "Mengirim..." : "Submit Pendaftaran"}</button>
      {message ? <p className={participantCode ? "form-message success-message" : "form-message"}>{message}</p> : null}
      {participantCode ? (
        <>
          <div className="success-code">
            <span>Kode unik peserta</span>
            <strong>{participantCode}</strong>
          </div>
          <p className="success-code-note">Mohon kode unik ini tidak dishare baik ke orang lain maupun di sosial media.</p>
        </>
      ) : null}
      {participantUrl ? <a className="button secondary full" href={participantUrl}>Buka link unik peserta</a> : null}
    </form>
  );
}

async function loadRegions(url: string, fallback: RegionOption[]) {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallback;
    const data = await response.json();
    if (!Array.isArray(data)) return fallback;
    return data.map((item) => ({ id: String(item.id), name: String(item.name) }));
  } catch {
    return fallback;
  }
}

async function findPostalCode(parts: string[]) {
  const query = parts.filter(Boolean).join(" ");
  if (!query) return "";

  try {
    const response = await fetch(`${postalCodeApiUrl}?q=${encodeURIComponent(query)}`);
    if (!response.ok) return "";
    const data = await response.json();
    const rows = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : Array.isArray(data.results) ? data.results : [];
    const first = rows[0];
    if (!first) return "";
    const code = first.postalcode || first.postal_code || first.kodepos || first.kode_pos || first.code || "";
    return String(code).replace(/\D/g, "").slice(0, 5);
  } catch {
    return "";
  }
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
