import Script from "next/script";

/**
 * Umami-аналитика. Скрипт подключается только если ОБА env-переменных
 * заданы при build-time: NEXT_PUBLIC_UMAMI_SCRIPT_URL и NEXT_PUBLIC_UMAMI_WEBSITE_ID.
 * Если не заданы — никакой скрипт не подгружается, никакого fetch на трекинг.
 *
 * Пример .env.local:
 *   NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://umami.equiply.ru/script.js
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID=abc-def-...
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !id) return null;

  return <Script src={src} data-website-id={id} strategy="afterInteractive" defer />;
}
