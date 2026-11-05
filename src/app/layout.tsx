import type { Metadata } from "next";
import "./globals.css"; // Sesuaikan dengan file CSS Anda

export const metadata: Metadata = {
  title: "Surat Jalan Generator",
  description: "Aplikasi generator surat jalan",
  icons: {
    icon: "/favicon.ico", // Sesuaikan dengan nama file yang Anda taruh di folder public
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
