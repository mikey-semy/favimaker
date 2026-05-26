import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeScript } from "@/lib/theme";
import { Analytics } from "@/components/Analytics";
import { Toaster } from "@/components/Toaster";
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
    "Сделай favicon и весь сопутствующий набор (manifest, apple-touch, android-chrome, maskable) в браузере. Любой Google-шрифт, любой цвет, любая форма.",
  // PWA / favicon — favimaker сам себе сделал иконку (см. public/favicon.svg)
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
  applicationName: "favimaker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "favimaker",
  },
};

// Next.js 14+ требует themeColor через отдельный viewport export
// (а не в metadata) — иначе deprecation warning в build.
export const viewport: Viewport = {
  themeColor: "#7c5cff",
};

/**
 * Service worker register — inline script в <head>. Регистрируем только
 * в проде (в dev mode SW мешает HMR), и только если браузер поддерживает.
 * Path /sw.js относительно scope /.
 */
const SW_REGISTER_SCRIPT = `
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
  });
}
`.trim();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
