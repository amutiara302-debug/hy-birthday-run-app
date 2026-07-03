import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HY Birthday Run 58",
  description: "Aplikasi pendaftaran HY Birthday Run 58"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
