"use client";

import * as React from "react";
import { Check, ChevronDown, Code, Copy, Download, Loader2 } from "lucide-react";
import { useConfig } from "@/lib/store";
import {
  buildFaviconZip,
  downloadBlob,
  INCLUDE_FILE_COUNTS,
  type ExportInclude,
} from "@/lib/export";
import { useExportInclude } from "@/lib/export-include";
import { buildHtmlSnippet, themeColorFromConfig } from "@/lib/manifest";
import {
  buildNextJsAppleIconSnippet,
  buildNextJsIconSnippet,
  buildReactSvgComponent,
  buildVueSvgComponent,
} from "@/lib/code-snippets";
import { renderToSvgString } from "@/lib/svg-render";
import { useLocale, useT } from "@/lib/i18n";
import { buildThumb, useHistory } from "@/lib/history";
import { onShortcut } from "@/lib/shortcuts";
import { toast } from "@/lib/toast";
import { Button, Checkbox, TextInput } from "./inputs";

const GROUP_ORDER: (keyof ExportInclude)[] = [
  "svg",
  "safariPinnedTab",
  "ico",
  "pngBrowser",
  "apple",
  "appleVariants",
  "android",
  "maskable",
  "mstile",
  "socialCard",
  "iosSplash",
  "manifest",
  "browserconfig",
  "htmlSnippet",
  "readme",
];

/** Группы которые не имеют смысла когда source=image (SVG-вектор бессмысленен
 *  поверх растра). Их чекбоксы блокируем и из счётчика исключаем. */
const SVG_ONLY_GROUPS: ReadonlyArray<keyof ExportInclude> = ["svg", "safariPinnedTab"];

const TOTAL_FILES = Object.values(INCLUDE_FILE_COUNTS).reduce((s, n) => s + n, 0);

export function ExportPanel() {
  const config = useConfig((s) => s.config);
  const addToHistory = useHistory((s) => s.add);
  const include = useExportInclude((s) => s.include);
  const setInclude = useExportInclude((s) => s.set);
  const selectAll = useExportInclude((s) => s.selectAll);
  const selectNone = useExportInclude((s) => s.selectNone);
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const [appName, setAppName] = React.useState("Site");
  // Social meta — для og-image + og/twitter snippet. Сейчас in-memory,
  // подобно appName (не persist'ится между перезагрузками — упрощение MVP).
  const [siteDescription, setSiteDescription] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState("");
  // Full meta head — opt-in, добавляет theme-color/application-name/
  // apple-mobile-web-app-* meta в HTML-сниппет.
  const [fullMetaHead, setFullMetaHead] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [socialOpen, setSocialOpen] = React.useState(false);

  // Векторные группы (favicon.svg, safari-pinned-tab.svg) не имеют смысла
  // при source=image — растр в SVG-обёртке бессмысленен. Блокируем чекбоксы
  // и исключаем из счётчика, иначе «N файлов» врёт.
  const svgGroupsDisabled = config.source === "image";
  const isGroupDisabled = (k: keyof ExportInclude) =>
    svgGroupsDisabled && SVG_ONLY_GROUPS.includes(k);
  const isGroupEffective = (k: keyof ExportInclude) =>
    include[k] && !isGroupDisabled(k);
  const selectedCount = GROUP_ORDER.reduce(
    (sum, k) => sum + (isGroupEffective(k) ? INCLUDE_FILE_COUNTS[k] : 0),
    0,
  );
  const totalForSource = svgGroupsDisabled
    ? TOTAL_FILES - SVG_ONLY_GROUPS.reduce((s, k) => s + INCLUDE_FILE_COUNTS[k], 0)
    : TOTAL_FILES;
  const noneSelected = selectedCount === 0;

  const handleDownload = React.useCallback(async () => {
    if (noneSelected) {
      toast.error(t("export.noneSelected"));
      return;
    }
    setBusy(true);
    try {
      const blob = await buildFaviconZip(config, appName, locale, include, {
        description: siteDescription,
        url: siteUrl,
        fullMetaHead,
      });
      downloadBlob(blob, `favicon-${(appName || "site").toLowerCase()}.zip`);
      try {
        const thumbDataUrl = await buildThumb(config);
        addToHistory({ appName: appName || "Site", config, thumbDataUrl });
      } catch {
        // история — best-effort
      }
    } finally {
      setBusy(false);
    }
  }, [
    noneSelected,
    t,
    config,
    appName,
    locale,
    include,
    addToHistory,
    siteDescription,
    siteUrl,
    fullMetaHead,
  ]);

  // Подписка на Ctrl/Cmd+S из GlobalShortcuts — single source для скачивания.
  React.useEffect(() => {
    return onShortcut("download", () => {
      handleDownload();
    });
  }, [handleDownload]);

  const handleCopySnippet = async () => {
    // Сниппет должен ссылаться только на файлы которые юзер реально включит
    // в архив. SVG-группы дополнительно прячем для image-source.
    const snippet = buildHtmlSnippet({
      svg: include.svg && config.source !== "image",
      safariPinnedTab: include.safariPinnedTab && config.source !== "image",
      safariPinnedTabColor: config.textColor,
      ico: include.ico,
      pngBrowser: include.pngBrowser,
      apple: include.apple,
      appleVariants: include.appleVariants,
      manifest: include.manifest,
      browserconfig: include.browserconfig,
      iosSplash: include.iosSplash,
      socialCard: include.socialCard && !!appName.trim(),
      socialTitle: appName,
      socialDescription: siteDescription,
      socialUrl: siteUrl,
      fullMetaHead,
      // Theme-color из config: bgColor для solid, gradient.from для gradient,
      // белый для transparent. Юзер увидит реальный цвет страницы при
      // загрузке на мобильном Chrome (адресная строка перекрашивается).
      themeColorLight: themeColorFromConfig(config),
    });
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = snippet;
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

      {/* Социальная карточка — collapsible, чтобы не загромождать дефолт.
          В свёрнутом виде юзер всё равно увидит og-image.png в архиве
          (title=appName, subtitle пустой). При раскрытии — поля. */}
      <div className="rounded-[var(--r-md)] border border-line bg-surface-2 overflow-hidden">
        <button
          type="button"
          onClick={() => setSocialOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-2 hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ChevronDown
              className={
                "size-3.5 transition-transform " + (socialOpen ? "rotate-0" : "-rotate-90")
              }
            />
            <span suppressHydrationWarning>{t("export.socialMeta")}</span>
          </span>
          <span className="text-[10px] text-muted">1200×630</span>
        </button>
        {socialOpen && (
          <div className="border-t border-line p-2 space-y-2">
            <div>
              <label
                className="block text-[10px] uppercase tracking-wider text-muted mb-1"
                suppressHydrationWarning
              >
                {t("export.siteDescription")}
              </label>
              <TextInput
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                placeholder={t("export.siteDescriptionPlaceholder")}
                maxLength={200}
              />
            </div>
            <div>
              <label
                className="block text-[10px] uppercase tracking-wider text-muted mb-1"
                suppressHydrationWarning
              >
                {t("export.siteUrl")}
              </label>
              <TextInput
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <Checkbox
              checked={fullMetaHead}
              onChange={setFullMetaHead}
              label={t("export.fullMetaHead")}
              title={t("export.fullMetaHeadHint")}
            />
          </div>
        )}
      </div>

      {/* Свёрнутая по умолчанию секция выбора файлов. Закрытый вид показывает
          счётчик — пользователь сразу видит сколько файлов попадёт в архив. */}
      <div className="rounded-[var(--r-md)] border border-line bg-surface-2 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-ink-2 hover:text-ink hover:bg-line/40 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ChevronDown
              className={
                "size-3.5 transition-transform " + (open ? "rotate-0" : "-rotate-90")
              }
            />
            <span suppressHydrationWarning>{t("export.contents")}</span>
          </span>
          <span className="font-mono tabular-nums text-[10px] text-muted">
            {t("export.filesCount")
              .replace("{n}", String(selectedCount))
              .replace("{total}", String(totalForSource))}
          </span>
        </button>

        {open && (
          <div className="border-t border-line p-2 space-y-0.5">
            {GROUP_ORDER.map((key) => {
              const groupDisabled = isGroupDisabled(key);
              return (
                <Checkbox
                  key={key}
                  checked={include[key]}
                  disabled={groupDisabled}
                  title={groupDisabled ? t("inc.svgUnavailable") : undefined}
                  onChange={(v) => setInclude(key, v)}
                  label={t(`inc.${key}` as Parameters<typeof t>[0])}
                  meta={`×${INCLUDE_FILE_COUNTS[key]}`}
                />
              );
            })}
            <div className="flex gap-1 pt-2 mt-1 border-t border-line">
              <button
                type="button"
                onClick={selectAll}
                className="flex-1 text-[10px] text-ink-2 hover:text-ink py-1 rounded-[var(--r-sm)] hover:bg-line/40 transition-colors cursor-pointer"
                suppressHydrationWarning
              >
                {t("export.selectAll")}
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="flex-1 text-[10px] text-ink-2 hover:text-ink py-1 rounded-[var(--r-sm)] hover:bg-line/40 transition-colors cursor-pointer"
                suppressHydrationWarning
              >
                {t("export.selectNone")}
              </button>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleDownload}
        disabled={busy || noneSelected}
        size="lg"
        className="w-full"
      >
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

      {/* Framework-specific snippets — для интеграций (Next.js, далее
          можно добавить Astro/Nuxt/etc). */}
      <div className="pt-2 border-t border-line">
        <p
          className="text-[10px] uppercase tracking-wider text-muted mb-2"
          suppressHydrationWarning
        >
          {t("export.frameworkCode")}
        </p>
        <div className="space-y-1.5">
          <CopyCodeButton
            label="app/icon.tsx"
            getCode={() => buildNextJsIconSnippet(config)}
            tooltip={t("export.copyNextIconHint")}
          />
          <CopyCodeButton
            label="app/apple-icon.tsx"
            getCode={() => buildNextJsAppleIconSnippet(config)}
            tooltip={t("export.copyNextAppleIconHint")}
          />
          {/* Inline-SVG React/Vue components — для in-app brand. Бессмысленны
              для source=image (там сам SVG-renderer возвращает null). */}
          <CopyCodeButton
            label="FavimakerIcon.tsx"
            getCode={async () => {
              const svg = await renderToSvgString(config);
              return svg ? buildReactSvgComponent(svg) : null;
            }}
            tooltip={t("export.copyReactComponentHint")}
            disabled={config.source === "image"}
            disabledTooltip={t("export.svgComponentUnavailable")}
          />
          <CopyCodeButton
            label="FavimakerIcon.vue"
            getCode={async () => {
              const svg = await renderToSvgString(config);
              return svg ? buildVueSvgComponent(svg) : null;
            }}
            tooltip={t("export.copyVueComponentHint")}
            disabled={config.source === "image"}
            disabledTooltip={t("export.svgComponentUnavailable")}
          />
        </div>
      </div>
    </div>
  );
}

function CopyCodeButton({
  label,
  getCode,
  tooltip,
  disabled,
  disabledTooltip,
}: {
  label: string;
  /** Возвращает код или null если генерация не имеет смысла (тогда — toast). */
  getCode: () => string | Promise<string | null>;
  tooltip: string;
  disabled?: boolean;
  disabledTooltip?: string;
}) {
  const t = useT();
  const [copied, setCopied] = React.useState(false);

  const onClick = async () => {
    if (disabled) return;
    const code = await getCode();
    if (code === null) {
      toast.error(disabledTooltip ?? t("export.codegenFailed"));
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // фолбэк для старых браузеров
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledTooltip : tooltip}
      className={
        "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--r-sm)] bg-surface-2 border border-line text-xs font-mono transition-colors " +
        (disabled
          ? "opacity-40 cursor-not-allowed text-muted"
          : "text-ink-2 hover:text-ink hover:border-accent/40 cursor-pointer")
      }
    >
      <span className="flex items-center gap-2 min-w-0 truncate">
        <Code className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {copied ? (
        <Check className="size-3.5 text-green-500 shrink-0" />
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}
      <span className="sr-only" suppressHydrationWarning>
        {copied ? t("export.copied") : t("export.copySnippet")}
      </span>
    </button>
  );
}
