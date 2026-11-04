import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xadboom",
  description:
    "Curated interior architecture assets, collectible furniture catalog, and curatorial atelier.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
