"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Download, Github, Stethoscope } from "lucide-react";
import { Editor } from "@/components/Editor";
import { Preview } from "@/components/Preview";
import { ExportPanel } from "@/components/ExportPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { UndoRedo } from "@/components/UndoRedo";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { InstallButton } from "@/components/InstallButton";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type RightTab = "export" | "history";

export default function HomePage() {
  const { replace } = useConfig();
  const t = useT();
  const [rightTab, setRightTab] = React.useState<RightTab>("export");

  // Восстановить config из URL hash при загрузке (#config=base64(json))
  React.useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/config=([^&]+)/);
    if (!match) return;
    try {
      const json = decodeURIComponent(escape(atob(match[1])));
      const parsed = JSON.parse(json);
      replace(parsed);
      history.replaceState(null, "", window.location.pathname);
    } catch {
      // невалидный hash — игнорируем
    }
  }, [replace]);

  return (
    <main className="min-h-screen flex flex-col">
      <GlobalShortcuts />
      <header className="border-b border-line">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 shrink-0 rounded-[var(--r-md)] bg-accent flex items-center justify-center text-[var(--accent-ink)] font-bold text-sm">
              f
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-none">favimaker</h1>
              <p
                className="text-[11px] text-muted leading-none mt-1 truncate"
                suppressHydrationWarning
              >
                {t("header.subtitle")}
              </p>
            </div>
          </div>
          {/* Action-кнопки: на мобильном только основное (Undo/Redo/Theme),
              остальное прячется. GitHub ссылка ушла в footer чтобы header
              на узких экранах не давил лого. */}
          <div className="flex items-center gap-1 shrink-0">
            <UndoRedo />
            <div className="w-px h-5 bg-line mx-1" aria-hidden />
            <InstallButton />
            <Link
              href="/audit"
              title={t("audit.title")}
              className="hidden sm:flex items-center justify-center size-8 rounded-[var(--r-md)] text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label={t("audit.title")}
            >
              <Stethoscope className="size-4" />
            </Link>
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-4 lg:px-6 lg:py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr_300px] gap-3 lg:gap-4">
          <aside className="bg-surface rounded-[var(--r-lg)] border border-line p-4 h-fit lg:sticky lg:top-4 overflow-hidden">
            <Editor />
          </aside>

          <section className="space-y-4">
            <Preview />
          </section>

          {/* Правая колонка — табы Export | History (по аналогии с Editor'ом
              слева). Раньше были две stacked-панели; tabs экономят высоту
              и одинаковая визуальная грамматика с левой стороной. */}
          <aside className="bg-surface rounded-[var(--r-lg)] border border-line p-4 h-fit lg:sticky lg:top-4 overflow-hidden">
            <div className="flex gap-0.5 mb-3 bg-surface-2 rounded-[var(--r-md)] p-1 border border-line">
              <RightTabBtn
                active={rightTab === "export"}
                onClick={() => setRightTab("export")}
                icon={<Download className="size-4 shrink-0" />}
                label={t("section.export")}
              />
              <RightTabBtn
                active={rightTab === "history"}
                onClick={() => setRightTab("history")}
                icon={<Clock className="size-4 shrink-0" />}
                label={t("section.history")}
              />
            </div>
            {/* key — перезапускает CSS-fade-анимацию tab-content при
                переключении, как в Editor.tsx */}
            <div key={rightTab} className="tab-content">
              {rightTab === "export" ? <ExportPanel /> : <HistoryPanel />}
            </div>
          </aside>
        </div>
      </div>

      <footer className="border-t border-line mt-6">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 text-[11px] text-muted flex items-center justify-between gap-3 flex-wrap">
          <span suppressHydrationWarning>
            {t("footer.builtWith")}{" "}
            <a
              href="https://claude.com/claude-code"
              className="text-ink-2 hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Claude Code
            </a>
          </span>
          <div className="flex items-center gap-3">
            <span suppressHydrationWarning>
              {t("footer.fontsBy")}{" "}
              <a
                href="https://fonts.google.com"
                className="text-ink-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Fonts
              </a>
            </span>
            <a
              href="https://github.com/mikey-semy/favimaker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-ink-2 hover:text-ink transition-colors"
              aria-label="GitHub"
            >
              <Github className="size-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function RightTabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 min-w-0 py-1.5 rounded-[var(--r-sm)] transition-colors cursor-pointer",
        active ? "bg-accent text-[var(--accent-ink)]" : "text-ink-2 hover:text-ink hover:bg-line/60",
      )}
    >
      {icon}
      <span className="text-[11px] font-medium truncate" suppressHydrationWarning>
        {label}
      </span>
    </button>
  );
}
