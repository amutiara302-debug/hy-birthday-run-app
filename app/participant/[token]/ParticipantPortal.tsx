"use client";

import { useState } from "react";
import type { Registration, RunSubmission } from "@/lib/types";

export default function ParticipantPortal({
  registration,
  runSubmission
}: {
  registration: Registration;
  runSubmission: RunSubmission | null;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/participant/${registration.participant_token}/run-proof`, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    setSubmitting(false);
    setMessage(response.ok ? "Bukti lari diterima dan menunggu review admin." : result.error || "Upload belum berhasil.");
  }

  return (
    <main className="page-shell">
      <section className="participant-grid">
        <article className="status-panel">
          <span className="pill">{registration.category}</span>
          <h1>{registration.full_name}</h1>
          <dl>
            <div><dt>Status pembayaran</dt><dd>{registration.payment_status}</dd></div>
            <div><dt>BIB</dt><dd>{registration.bib_number || "Belum tersedia"}</dd></div>
            <div><dt>Status pengiriman</dt><dd>{registration.shipping_status}</dd></div>
            <div><dt>Resi</dt><dd>{registration.tracking_number || "Belum tersedia"}</dd></div>
            <div><dt>Status virtual</dt><dd>{registration.run_status}</dd></div>
          </dl>
        </article>

        {registration.category === "Virtual" ? (
          <form className="upload-form" onSubmit={handleSubmit}>
            <p className="eyebrow">Upload Bukti Lari</p>
            <h2>Virtual Run 5,8KM</h2>
            <label>Tanggal lari <input required name="run_date" type="date" /></label>
            <div className="two-col">
              <label>Jarak tempuh <input required name="distance" placeholder="5,8KM" /></label>
              <label>Durasi/pace <input required name="duration_pace" placeholder="00:45:20" /></label>
            </div>
            <label>Nama aplikasi lari <input required name="app_name" placeholder="Strava" /></label>
            <label>Link aktivitas jika ada <input name="activity_link" type="url" placeholder="https://" /></label>
            <label>Upload screenshot/bukti <input required name="run_proof" type="file" accept="image/*,.pdf" /></label>
            <label>Catatan tambahan <textarea name="notes" /></label>
            <button className="button primary full" disabled={submitting} type="submit">{submitting ? "Mengirim..." : "Upload Bukti Lari"}</button>
            {message ? <p className="form-message">{message}</p> : null}
            {runSubmission ? <p className="muted">Upload terakhir: {runSubmission.status}</p> : null}
          </form>
        ) : (
          <article className="status-panel">
            <p className="eyebrow">Offline Run</p>
            <h2>Sampai ketemu 30 Agustus</h2>
            <p>Peserta offline tidak perlu upload bukti lari. Simpan link ini untuk mengecek BIB dan resi pengiriman.</p>
          </article>
        )}
      </section>
    </main>
  );
}
