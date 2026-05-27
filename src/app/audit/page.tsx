"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, X, AlertCircle, Globe, Clipboard } from "lucide-react";
import { auditHtmlHead, fetchHtmlViaCorsProxy, type AuditCheck, type AuditResult } from "@/lib/audit";
import { useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { Button, TextInput } from "@/components/inputs";

/**
 * /audit — диагностика head'а сайта. Юзер вставляет URL (попытаемся
 * fetch через CORS-proxy) или сразу HTML — парсим, выдаём чек-лист
 * того что есть/чего нет среди favicon/PWA/social тегов.
 */
export default function AuditPage() {
  const t = useT();
  const [url, setUrl] = React.useState("");
  const [html, setHtml] = React.useState("");
  const [result, setResult] = React.useState<AuditResult | null>(null);
  const [fetching, setFetching] = React.useState(false);

  const runAudit = (htmlText: string) => {
    if (!htmlText.trim()) {
      toast.error(t("audit.emptyInput"));
      return;
    }
    const r = auditHtmlHead(htmlText);
    if (r.checks.length === 0) {
      toast.error(t("audit.parseFailed"));
      return;
    }
    setResult(r);
  };

  const handleFetchByUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error(t("audit.emptyUrl"));
      return;
    }
    setFetching(true);
    try {
      const fetched = await fetchHtmlViaCorsProxy(trimmed);
      setHtml(fetched);
      runAudit(fetched);
    } catch {
      toast.error(t("audit.fetchFailed"));
    } finally {
      setFetching(false);
    }
  };

  const handleAuditPasted = () => runAudit(html);

  const grouped = result
    ? {
        favicon: result.checks.filter((c) => c.category === "favicon"),
        pwa: result.checks.filter((c) => c.category === "pwa"),
        social: result.checks.filter((c) => c.category === "social"),
        general: result.checks.filter((c) => c.category === "general"),
      }
    : null;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <div className="mx-auto max-w-[1000px] px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span suppressHydrationWarning>{t("audit.backToEditor")}</span>
          </Link>
          <h1 className="text-sm font-semibold" suppressHydrationWarning>
            {t("audit.title")}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1000px] w-full px-6 py-6 flex-1 space-y-5">
        <p className="text-sm text-ink-2 leading-relaxed" suppressHydrationWarning>
          {t("audit.intro")}
        </p>

        {/* URL fetch */}
        <div className="bg-surface rounded-[var(--r-lg)] border border-line p-4 space-y-2">
          <label
            className="block text-[11px] uppercase tracking-wider text-muted"
            suppressHydrationWarning
          >
            {t("audit.urlLabel")}
          </label>
          <div className="flex gap-2">
            <TextInput
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              className="flex-1"
            />
            <Button onClick={handleFetchByUrl} disabled={fetching} size="md">
              {fetching ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span suppressHydrationWarning>{t("audit.fetching")}</span>
                </>
              ) : (
                <>
                  <Globe className="size-4" />
                  <span suppressHydrationWarning>{t("audit.fetchAndAudit")}</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-muted" suppressHydrationWarning>
            {t("audit.urlHint")}
          </p>
        </div>

        {/* Paste HTML fallback */}
        <div className="bg-surface rounded-[var(--r-lg)] border border-line p-4 space-y-2">
          <label
            className="block text-[11px] uppercase tracking-wider text-muted"
            suppressHydrationWarning
          >
            {t("audit.pasteLabel")}
          </label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder={t("audit.pastePlaceholder")}
            rows={8}
            className="w-full rounded-[var(--r-md)] bg-surface-2 border border-line px-3 py-2 text-xs font-mono text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 resize-y"
          />
          <Button onClick={handleAuditPasted} variant="secondary" size="md">
            <Clipboard className="size-4" />
            <span suppressHydrationWarning>{t("audit.auditPasted")}</span>
          </Button>
        </div>

        {/* Results */}
        {result && grouped && (
          <div className="space-y-3">
            <div className="bg-surface rounded-[var(--r-lg)] border border-line p-4 flex items-center justify-between">
              <div>
                {result.pageTitle && (
                  <p className="text-sm font-semibold mb-1">{result.pageTitle}</p>
                )}
                <p
                  className="text-[11px] text-muted"
                  suppressHydrationWarning
                >
                  {t("audit.scoreLabel").replace("{score}", String(result.score))}
                </p>
              </div>
              <ScoreBadge score={result.score} />
            </div>

            <CategoryBlock title={t("audit.catFavicon")} checks={grouped.favicon} />
            <CategoryBlock title={t("audit.catPwa")} checks={grouped.pwa} />
            <CategoryBlock title={t("audit.catSocial")} checks={grouped.social} />
            <CategoryBlock title={t("audit.catGeneral")} checks={grouped.general} />
          </div>
        )}
      </div>
    </main>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-green-500 border-green-500/40 bg-green-500/10"
      : score >= 50
        ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/10"
        : "text-red-500 border-red-500/40 bg-red-500/10";
  return (
    <div
      className={
        "flex items-center justify-center size-14 rounded-full border-2 font-mono font-bold text-lg tabular-nums " +
        color
      }
    >
      {score}
    </div>
  );
}

function CategoryBlock({ title, checks }: { title: string; checks: AuditCheck[] }) {
  const t = useT();
  return (
    <div className="bg-surface rounded-[var(--r-lg)] border border-line p-4">
      <h2 className="text-xs uppercase tracking-wider text-muted mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            <StatusIcon status={c.status} />
            <div className="flex-1 min-w-0">
              <span className="text-ink-2" suppressHydrationWarning>
                {t(c.labelKey as Parameters<typeof t>[0])}
              </span>
              {c.details && (
                <span className="text-[11px] text-muted ml-2 font-mono break-all">
                  {c.details}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: AuditCheck["status"] }) {
  if (status === "ok") return <Check className="size-4 text-green-500 shrink-0 mt-0.5" />;
  if (status === "warn") return <AlertCircle className="size-4 text-yellow-500 shrink-0 mt-0.5" />;
  return <X className="size-4 text-red-500 shrink-0 mt-0.5" />;
}
