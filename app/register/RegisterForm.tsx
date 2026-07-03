"use client";

import { useMemo, useState } from "react";
import { defaultSettings, formatRupiah, getRegistrationTotal, getShirtSurcharge, premiumShirtFee, shirtSizes } from "@/lib/config";
import type { Category } from "@/lib/types";

export default function RegisterForm({ initialCategory }: { initialCategory: Category }) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [shirtSize, setShirtSize] = useState("M");
  const [message, setMessage] = useState("");
  const [participantUrl, setParticipantUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const shirtSurcharge = useMemo(() => getShirtSurcharge(shirtSize), [shirtSize]);
  const total = useMemo(() => getRegistrationTotal(category, shirtSize), [category, shirtSize]);

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
          <select required name="shirt_size" value={shirtSize} onChange={(event) => setShirtSize(event.target.value)}>
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
        <small>Size 3XL, 4XL, dan 5XL dikenakan tambahan {formatRupiah(premiumShirtFee)}.</small>
        <div className="size-table-wrap">
          <table className="size-table">
            <thead>
              <tr>
                <th>Ukuran</th>
                <th>XS</th>
                <th>S</th>
                <th>M</th>
                <th>L</th>
                <th>XL</th>
                <th>XXL</th>
                <th>3XL</th>
                <th>4XL</th>
                <th>5XL</th>
              </tr>
            </thead>
            <tbody>
              <tr><th>A Lebar dada</th><td>48</td><td>50</td><td>52</td><td>54</td><td>56</td><td>58</td><td>60</td><td>62</td><td>64</td></tr>
              <tr><th>B Panjang baju</th><td>62</td><td>64</td><td>66</td><td>68</td><td>70</td><td>72</td><td>74</td><td>76</td><td>78</td></tr>
              <tr><th>C Panjang tangan</th><td>21</td><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td></tr>
              <tr><th>D Lingkar leher</th><td>18</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td><td>23</td><td>24</td><td>25</td></tr>
              <tr><th>E Lingkar tangan bawah</th><td>30</td><td>31</td><td>32</td><td>33</td><td>34</td><td>35</td><td>36</td><td>37</td><td>38</td></tr>
            </tbody>
          </table>
        </div>
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
      <button className="button primary full" disabled={submitting} type="submit">{submitting ? "Mengirim..." : "Submit Pendaftaran"}</button>
      {message ? <p className="form-message">{message}</p> : null}
      {participantUrl ? <a className="button secondary full" href={participantUrl}>Buka link unik peserta</a> : null}
    </form>
  );
}
