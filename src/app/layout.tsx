import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "favimaker — Favicon generator",
  description:
    "Сделай fav-иконку и весь сопутствующий набор (manifest, apple-touch-icon, android-chrome) в браузере. Любой Google-шрифт, любой цвет, любая форма.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>{children}</body>
    </html>
  );
}
