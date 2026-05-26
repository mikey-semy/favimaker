"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Install-prompt PWA. Появляется только когда Chrome/Edge сами объявляют
 * совместимость через beforeinstallprompt — мы не пытаемся «уговорить» юзера,
 * просто подхватываем нативный prompt и даём кнопку.
 *
 * После accept'а или dismiss'а событие пропадает (стандартное поведение)
 * — кнопка тоже скрывается. Safari/Firefox этот API не поддерживают,
 * там кнопка не появится.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallButton() {
  const t = useT();
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(
    null,
  );

  React.useEffect(() => {
    const handler = (e: Event) => {
      // beforeinstallprompt отменяем чтобы не показывать дефолтный mini-infobar
      // — управляем сами через нашу кнопку.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      // После успешной установки браузер фрост ивент — скрываем кнопку.
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!deferredPrompt) return null;

  const handleClick = async () => {
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice; // outcome не важен — в любом случае событие израсходовано
    setDeferredPrompt(null);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={t("pwa.install")}
      aria-label={t("pwa.install")}
      className="flex items-center justify-center size-8 rounded-[var(--r-md)] text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
    >
      <Download className="size-4" />
    </button>
  );
}
