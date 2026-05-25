"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { useConfig } from "@/lib/store";
import { buildFaviconZip, downloadBlob } from "@/lib/export";
import { buildHtmlSnippet } from "@/lib/manifest";
import { Button, TextInput } from "./inputs";

export function ExportPanel() {
  const config = useConfig((s) => s.config);
  const [appName, setAppName] = React.useState("Site");
  const [busy, setBusy] = React.useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await buildFaviconZip(config, appName);
      downloadBlob(blob, `favicon-${(appName || "site").toLowerCase()}.zip`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
          Имя приложения (для manifest)
        </label>
        <TextInput value={appName} onChange={(e) => setAppName(e.target.value)} />
      </div>

      <Button onClick={handleDownload} disabled={busy} size="lg" className="w-full">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Готовлю архив…
          </>
        ) : (
          <>
            <Download className="size-4" />
            Скачать ZIP
          </>
        )}
      </Button>

      <details className="group bg-surface-2 rounded-[var(--r-md)] border border-line">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-ink-2 hover:text-ink flex items-center gap-2">
          <span className="text-muted transition-transform group-open:rotate-90">▸</span>
          HTML-сниппет для &lt;head&gt;
        </summary>
        <pre className="p-3 pt-0 text-[11px] font-mono text-ink-2 overflow-x-auto whitespace-pre-wrap break-all">
          {buildHtmlSnippet()}
        </pre>
      </details>

      <div className="text-[11px] text-muted leading-relaxed">
        В ZIP-архиве:
        <ul className="mt-1 space-y-0.5 list-disc list-inside marker:text-muted/50">
          <li>favicon.ico (16+32+48 в одном файле)</li>
          <li>PNG 16, 32, 180, 192, 512 px</li>
          <li>site.webmanifest</li>
          <li>HTML-сниппет для вставки в &lt;head&gt;</li>
        </ul>
      </div>
    </div>
  );
}
