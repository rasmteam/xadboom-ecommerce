import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xadboom Design System & Atelier",
  description:
    "Curated interior architecture assets, collectible furniture catalog, and curatorial atelier administration portal.",
};

// Reveal FOUC guard: hide [data-reveal] only while the motion script is expected to run.
const motionGuard = `(function(){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.classList.add('motion-enabled');window.addEventListener('load',function(){setTimeout(function(){if(!d.classList.contains('motion-loaded'))d.classList.remove('motion-enabled')},1200)})})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionGuard }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Script src="/legacy/xadboom-motion.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
