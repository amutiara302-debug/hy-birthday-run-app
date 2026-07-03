import Link from "next/link";
import RegisterForm from "./RegisterForm";
import { defaultSettings } from "@/lib/config";
import type { Category } from "@/lib/types";

export default function RegisterPage({ searchParams }: { searchParams: { category?: string } }) {
  const initialCategory: Category = searchParams.category === "Virtual" ? "Virtual" : "Offline";

  return (
    <main className="page-shell">
      <Link className="back-link" href="/">Kembali ke beranda</Link>
      <section className="registration-layout">
        <div>
          <p className="eyebrow">Form Pendaftaran</p>
          <h1>Daftar HY Birthday Run 58</h1>
          <p className="tagline">Pendaftaran dibuka 7 Juli 2026 dan ditutup 31 Juli 2026. Jika kuota penuh, kategori akan otomatis ditutup.</p>
          <div className="payment-box">
            <strong>Pembayaran manual</strong>
            <span>Upload bukti pembayaran saat mendaftar.</span>
            <span>{`Nomor rekening: ${defaultSettings.bankAccountNumber} (${defaultSettings.bankName}) a/n ${defaultSettings.accountHolder}`}</span>
            <small>BIB dibuat otomatis setelah admin memverifikasi pembayaran.</small>
          </div>
        </div>
        <RegisterForm initialCategory={initialCategory} />
      </section>
    </main>
  );
}
