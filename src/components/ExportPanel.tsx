"use client";

import * as React from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { useConfig } from "@/lib/store";
import { buildFaviconZip, downloadBlob } from "@/lib/export";
import { buildHtmlSnippet } from "@/lib/manifest";
import { useLocale, useT } from "@/lib/i18n";
import { buildThumb, useHistory } from "@/lib/history";
import { Button, TextInput } from "./inputs";

export function ExportPanel() {
  const config = useConfig((s) => s.config);
  const addToHistory = useHistory((s) => s.add);
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const [appName, setAppName] = React.useState("Site");
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await buildFaviconZip(config, appName, locale);
      downloadBlob(blob, `favicon-${(appName || "site").toLowerCase()}.zip`);
      // Сохраняем в локальную историю — миниатюра + полный конфиг для restore.
      // Ошибка в thumb не должна ломать скачивание, поэтому отдельный try.
      try {
        const thumbDataUrl = await buildThumb(config);
        addToHistory({ appName: appName || "Site", config, thumbDataUrl });
      } catch {
        // история — best-effort, не критично
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(buildHtmlSnippet());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // фолбэк для старых браузеров без clipboard API
      const ta = document.createElement("textarea");
      ta.value = buildHtmlSnippet();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          className="block text-[11px] uppercase tracking-wider text-muted mb-1.5"
          suppressHydrationWarning
        >
          {t("export.appName")}
        </label>
        <TextInput value={appName} onChange={(e) => setAppName(e.target.value)} />
      </div>

      <Button onClick={handleDownload} disabled={busy} size="lg" className="w-full">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span suppressHydrationWarning>{t("btn.preparingZip")}</span>
          </>
        ) : (
          <>
            <Download className="size-4" />
            <span suppressHydrationWarning>{t("btn.download")}</span>
          </>
        )}
      </Button>

      <Button variant="secondary" size="md" onClick={handleCopySnippet} className="w-full">
        {copied ? (
          <>
            <Check className="size-4 text-green-500" />
            <span suppressHydrationWarning>{t("export.copied")}</span>
          </>
        ) : (
          <>
            <Copy className="size-4" />
            <span suppressHydrationWarning>{t("export.copySnippet")}</span>
          </>
        )}
      </Button>

      <div className="text-[11px] text-muted leading-relaxed" suppressHydrationWarning>
        {t("export.fileList")}
        <ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-muted/50">
          <li>favicon.ico (16+32+48)</li>
          <li>PNG: 16, 32, 96, 150, 180, 192, 512</li>
          <li>maskable: 192, 512</li>
          <li>site.webmanifest + browserconfig.xml</li>
        </ul>
      </div>
    </div>
  );
}
