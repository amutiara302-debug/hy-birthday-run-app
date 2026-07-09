import { Resend } from "resend";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = "HY Birthday Run <admin@hybirthdayrun.com>";

  if (!apiKey) {
    const message = "RESEND_API_KEY belum tersedia di Vercel.";
    console.warn(message, "Email skipped:", options.subject);
    return { ok: false, error: message };
  }

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    return { ok: true };
  } catch (error) {
    console.warn("Email failed. Continuing without blocking the registration.", error);
    return {
      ok: false,
      error: getEmailErrorMessage(error)
    };
  }
}

function getEmailErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message);
  }
  return "Email gagal dikirim oleh Resend. Cek RESEND_API_KEY, status domain Resend, dan Vercel Logs.";
}

export function registrationEmail(name: string, participantUrl: string, participantCode: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#241230">
      <h1>HY Birthday Run 58</h1>
      <p>Halo ${name},</p>
      <p>Pendaftaran diterima, sampai ketemu di tanggal 30 Agustus.</p>
      <p>Kode unik peserta kamu: <strong>${participantCode}</strong></p>
      <p>Gunakan link unik berikut untuk melihat status pendaftaran, resi pengiriman, dan upload bukti lari virtual jika kamu memilih kategori virtual.</p>
      <p><a href="${participantUrl}">${participantUrl}</a></p>
      <p>Verifikasi pembayaran pada pendaftaran paling lambat membutuhkan waktu 24 jam. Silakan melakukan pengecekan rutin dengan menggunakan kode unik anda.</p>
      <p>Salam sehat,<br>Panitia HY Birthday Run</p>
    </div>
  `;
}

export function finisherEmail(name: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#241230">
      <h1>Finisher Confirmed</h1>
      <p>Halo ${name},</p>
      <p>Bukti lari virtual kamu sudah disetujui. Status kamu sekarang: <strong>finisher confirmed</strong>.</p>
      <p>Terima kasih sudah ikut bergerak sehat bersama HY Birthday Run 58.</p>
    </div>
  `;
}
