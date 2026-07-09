"use client";

import { useState } from "react";
import { defaultSettings, formatRupiah, getRegistrationTotal } from "@/lib/config";
import type { Registration, RunSubmission } from "@/lib/types";

type AdminData = {
  registrations: Registration[];
  runSubmissions: Array<RunSubmission & { registrations: Pick<Registration, "full_name" | "email"> | null }>;
};

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadData(event?: React.FormEvent) {
    event?.preventDefault();
    const response = await fetch("/api/admin/registrations", {
      headers: { "x-admin-password": password }
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Login admin gagal.");
      return;
    }
    setMessage("");
    setData(result);
  }

  async function verifyPayment(id: string) {
    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "verify_payment" })
    });
    await loadData();
  }

  async function rejectPayment(id: string) {
    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "reject_payment" })
    });
    await loadData();
  }

  async function saveTracking(id: string, trackingNumber: string) {
    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "save_tracking", tracking_number: trackingNumber })
    });
    await loadData();
  }

  async function resendRegistrationEmail(id: string) {
    setMessage("Mengirim email peserta...");
    const response = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "resend_registration_email" })
    });
    const result = await response.json();
    setMessage(response.ok ? "Email peserta berhasil dikirim." : result.error || "Email gagal dikirim.");
  }

  async function approveRun(id: string) {
    await fetch("/api/admin/run-submissions", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "approve" })
    });
    await loadData();
  }

  async function copyParticipantLink(item: Registration) {
    const origin = window.location.origin;
    const participantUrl = `${origin}/participant/${item.participant_token}`;
    await navigator.clipboard.writeText(participantUrl);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  const registrations = data?.registrations || [];
  const pendingPayments = registrations.filter((item) => item.payment_status === "pending").length;
  const verified = registrations.filter((item) => item.payment_status === "verified").length;
  const rejected = registrations.filter((item) => item.payment_status === "rejected").length;
  const pendingRuns = data?.runSubmissions.filter((item) => item.status === "review").length || 0;
  const offlineRegistrations = registrations.filter((item) => item.category === "Offline");
  const virtualRegistrations = registrations.filter((item) => item.category === "Virtual");
  const offlineCount = offlineRegistrations.length;
  const virtualCount = virtualRegistrations.length;
  const offlineVerified = offlineRegistrations.filter((item) => item.payment_status === "verified").length;
  const offlinePending = offlineRegistrations.filter((item) => item.payment_status === "pending").length;
  const virtualVerified = virtualRegistrations.filter((item) => item.payment_status === "verified").length;
  const virtualPending = virtualRegistrations.filter((item) => item.payment_status === "pending").length;
  const notShipped = registrations.filter((item) => item.shipping_status !== "shipped").length;
  const shipped = registrations.filter((item) => item.shipping_status === "shipped").length;
  const estimatedRevenue = registrations.reduce((total, item) => total + getRegistrationTotal(item.category, item.shirt_size), 0);
  const confirmedRevenue = registrations
    .filter((item) => item.payment_status === "verified")
    .reduce((total, item) => total + getRegistrationTotal(item.category, item.shirt_size), 0);
  const pendingRevenue = registrations
    .filter((item) => item.payment_status === "pending")
    .reduce((total, item) => total + getRegistrationTotal(item.category, item.shirt_size), 0);

  return (
    <main className="page-shell">
      <section className="section-heading">
        <p className="eyebrow">Admin Panel</p>
        <h1>Operasional HY Birthday Run</h1>
      </section>

      {!data ? (
        <form className="login-panel" onSubmit={loadData}>
          <label>Password admin <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="button primary" type="submit">Masuk Admin</button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      ) : (
        <div className="admin-stack">
          <div className="dashboard-summary">
            <article className="summary-card green"><span>Total Pendaftar</span><strong>{registrations.length}</strong><small>Offline {offlineCount} / Virtual {virtualCount}</small></article>
            <article className="summary-card cyan"><span>Uang Confirmed</span><strong>{formatRupiah(confirmedRevenue)}</strong><small>{verified} pembayaran verified</small></article>
            <article className="summary-card amber"><span>Pending Payment</span><strong>{formatRupiah(pendingRevenue)}</strong><small>{pendingPayments} pembayaran pending</small></article>
            <article className="summary-card red"><span>Rejected</span><strong>{rejected}</strong><small>Pendaftaran ditolak</small></article>
          </div>

          <section className="admin-card dashboard-card">
            <div className="table-heading">
              <h2>HY Birthday Run 58 - Recap Summary</h2>
              <button className="button secondary" onClick={() => exportCsv(registrations)}>Export CSV</button>
            </div>
            <div className="recap-grid">
              <div className="recap-chart">
                <div style={{ height: `${Math.min(100, registrations.length * 2)}%` }}><span>Total</span></div>
                <div style={{ height: `${Math.min(100, verified * 2)}%` }}><span>Paid</span></div>
                <div style={{ height: `${Math.min(100, pendingPayments * 2)}%` }}><span>Pending</span></div>
                <div style={{ height: `${Math.min(100, rejected * 2)}%` }}><span>Reject</span></div>
              </div>
              <div className="goal-list">
                <h3>Category Status</h3>
                <Progress label="Offline Run" value={offlineCount} total={defaultSettings.offlineQuota} />
                <PaymentSplit label="Offline payment" verified={offlineVerified} pending={offlinePending} />
                <Progress label="Virtual Run" value={virtualCount} total={defaultSettings.virtualQuota} />
                <PaymentSplit label="Virtual payment" verified={virtualVerified} pending={virtualPending} />
              </div>
            </div>
            <div className="summary-totals">
              <div><strong>{formatRupiah(estimatedRevenue)}</strong><span>Estimasi revenue semua pendaftar</span></div>
              <div><strong>{formatRupiah(confirmedRevenue)}</strong><span>Revenue confirmed/verified</span></div>
              <div><strong>{notShipped}</strong><span>Paket belum dikirim</span></div>
              <div><strong>{shipped}</strong><span>Paket sudah dikirim</span></div>
            </div>
          </section>

          <section className="admin-card">
            <div className="table-heading">
              <h2>Pendaftar</h2>
            </div>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr><th>Nama</th><th>Kode</th><th>Kategori</th><th>Size</th><th>Total</th><th>Bayar</th><th>Bukti</th><th>Email</th><th>Resi</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {registrations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}<br /><small>{item.email}</small></td>
                      <td>
                        <strong className="participant-code">{getParticipantCode(item)}</strong>
                        <button className="copy-link-button" type="button" onClick={() => copyParticipantLink(item)}>
                          {copiedId === item.id ? "Tersalin" : "Copy Link"}
                        </button>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.shirt_size}</td>
                      <td>{formatRupiah(getRegistrationTotal(item.category, item.shirt_size))}</td>
                      <td>{item.payment_status}</td>
                      <td>
                        {item.payment_proof_url ? (
                          <a className="table-link" href={item.payment_proof_url} target="_blank" rel="noreferrer">Lihat Bukti</a>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td><button type="button" onClick={() => resendRegistrationEmail(item.id)}>Kirim Email</button></td>
                      <td>
                        <input
                          aria-label={`Resi ${item.full_name}`}
                          defaultValue={item.tracking_number || ""}
                          onBlur={(event) => event.currentTarget.value && saveTracking(item.id, event.currentTarget.value)}
                        />
                      </td>
                      <td>
                        {item.payment_status === "pending" ? (
                          <div className="action-buttons">
                            <button onClick={() => verifyPayment(item.id)}>Verifikasi</button>
                            <button className="danger-button" onClick={() => rejectPayment(item.id)}>Reject</button>
                          </div>
                        ) : item.payment_status === "rejected" ? (
                          <span className="status-rejected">Rejected</span>
                        ) : (
                          <span>OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {message ? <p className="form-message admin-message">{message}</p> : null}
          </section>

          <section className="admin-card">
            <h2>Bukti Lari Virtual</h2>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr><th>Peserta</th><th>Tanggal</th><th>Jarak</th><th>Durasi/Pace</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {(data.runSubmissions || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.registrations?.full_name || "-"}</td>
                      <td>{item.run_date}</td>
                      <td>{item.distance}</td>
                      <td>{item.duration_pace}</td>
                      <td>{item.status}</td>
                      <td>{item.status === "review" ? <button onClick={() => approveRun(item.id)}>Approve</button> : "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="goal-row">
      <div><strong>{label}</strong><span>{value}/{total}</span></div>
      <div className="goal-track"><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function PaymentSplit({ label, verified, pending }: { label: string; verified: number; pending: number }) {
  return (
    <div className="payment-split">
      <strong>{label}</strong>
      <span><b>{verified}</b> verified</span>
      <span><b>{pending}</b> pending</span>
    </div>
  );
}

function exportCsv(rows: Registration[]) {
  const origin = window.location.origin;
  const headers = ["Nama", "Email", "Kode Unik", "Link Peserta", "Kategori", "Telepon", "Size", "Total", "Pembayaran", "Bukti Transfer", "Resi"];
  const lines = rows.map((row) => [
    row.full_name,
    row.email,
    getParticipantCode(row),
    `${origin}/participant/${row.participant_token}`,
    row.category,
    row.phone,
    row.shirt_size,
    getRegistrationTotal(row.category, row.shirt_size),
    row.payment_status,
    row.payment_proof_url || "",
    row.tracking_number || ""
  ]);
  const csv = [headers, ...lines].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hy-birthday-run-registrations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function getParticipantCode(row: Registration) {
  return row.participant_token.slice(0, 8).toUpperCase();
}
