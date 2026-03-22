import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AINEK — Умное Зеркало",
  description: "Интеллектуальное зеркало для виртуальной примерки одежды с технологией AI",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={playfair.variable}>
      <head>
        <meta name="theme-color" content="#06060f" />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0, background: "#06060f", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
