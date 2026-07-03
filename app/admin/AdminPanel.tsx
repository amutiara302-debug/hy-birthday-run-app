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

  async function saveTracking(id: string, trackingNumber: string) {
    await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "save_tracking", tracking_number: trackingNumber })
    });
    await loadData();
  }

  async function approveRun(id: string) {
    await fetch("/api/admin/run-submissions", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id, action: "approve" })
    });
    await loadData();
  }

  const registrations = data?.registrations || [];
  const pendingPayments = registrations.filter((item) => item.payment_status === "pending").length;
  const verified = registrations.filter((item) => item.payment_status === "verified").length;
  const pendingRuns = data?.runSubmissions.filter((item) => item.status === "review").length || 0;
  const offlineCount = registrations.filter((item) => item.category === "Offline").length;
  const virtualCount = registrations.filter((item) => item.category === "Virtual").length;
  const estimatedRevenue = registrations
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
            <article className="summary-card green"><span>Transaction</span><strong>{registrations.length}</strong><small>Total pendaftar</small></article>
            <article className="summary-card cyan"><span>Paid</span><strong>{verified}</strong><small>{formatRupiah(estimatedRevenue)}</small></article>
            <article className="summary-card amber"><span>Pending</span><strong>{pendingPayments}</strong><small>{formatRupiah(pendingRevenue)}</small></article>
            <article className="summary-card red"><span>Run Review</span><strong>{pendingRuns}</strong><small>Bukti lari virtual</small></article>
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
                <div style={{ height: `${Math.min(100, pendingRuns * 2)}%` }}><span>Review</span></div>
              </div>
              <div className="goal-list">
                <h3>Goal Category</h3>
                <Progress label="Offline Run" value={offlineCount} total={defaultSettings.offlineQuota} />
                <Progress label="Virtual Run" value={virtualCount} total={defaultSettings.virtualQuota} />
              </div>
            </div>
            <div className="summary-totals">
              <div><strong>{formatRupiah(estimatedRevenue)}</strong><span>Total revenue verified</span></div>
              <div><strong>{offlineCount}</strong><span>Offline participants</span></div>
              <div><strong>{virtualCount}</strong><span>Virtual participants</span></div>
              <div><strong>{registrations.length}</strong><span>Total participants</span></div>
            </div>
          </section>

          <section className="admin-card">
            <div className="table-heading">
              <h2>Pendaftar</h2>
            </div>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr><th>Nama</th><th>Kategori</th><th>Size</th><th>Total</th><th>Bayar</th><th>Resi</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {registrations.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}<br /><small>{item.email}</small></td>
                      <td>{item.category}</td>
                      <td>{item.shirt_size}</td>
                      <td>{formatRupiah(getRegistrationTotal(item.category, item.shirt_size))}</td>
                      <td>{item.payment_status}</td>
                      <td>
                        <input
                          aria-label={`Resi ${item.full_name}`}
                          defaultValue={item.tracking_number || ""}
                          onBlur={(event) => event.currentTarget.value && saveTracking(item.id, event.currentTarget.value)}
                        />
                      </td>
                      <td>
                        {item.payment_status !== "verified" ? <button onClick={() => verifyPayment(item.id)}>Verifikasi</button> : <span>OK</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function exportCsv(rows: Registration[]) {
  const headers = ["Nama", "Email", "Kategori", "Telepon", "Size", "Total", "Pembayaran", "Resi"];
  const lines = rows.map((row) => [
    row.full_name,
    row.email,
    row.category,
    row.phone,
    row.shirt_size,
    getRegistrationTotal(row.category, row.shirt_size),
    row.payment_status,
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
