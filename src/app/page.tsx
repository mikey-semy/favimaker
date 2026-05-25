"use client";

import * as React from "react";
import { Github } from "lucide-react";
import { Editor } from "@/components/Editor";
import { Preview } from "@/components/Preview";
import { ExportPanel } from "@/components/ExportPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const { replace } = useConfig();
  const t = useT();

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
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-[var(--r-md)] bg-accent flex items-center justify-center text-[var(--accent-ink)] font-bold text-sm">
              f
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">favimaker</h1>
              <p className="text-[11px] text-muted leading-none mt-1" suppressHydrationWarning>
                {t("header.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LangToggle />
            <ThemeToggle />
            <a
              href="https://github.com/mikey-semy/favimaker"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center size-8 rounded-[var(--r-md)] text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="GitHub"
            >
              <Github className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_320px] gap-6">
          <aside className="bg-surface rounded-[var(--r-lg)] border border-line p-5 h-fit lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <Editor />
          </aside>

          <section className="space-y-4">
            <Preview />
          </section>

          <aside className="bg-surface rounded-[var(--r-lg)] border border-line p-5 h-fit lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold mb-4" suppressHydrationWarning>
              {t("section.export")}
            </h2>
            <ExportPanel />
          </aside>
        </div>
      </div>

      <footer className="border-t border-line mt-12">
        <div className="mx-auto max-w-[1600px] px-6 py-6 text-[11px] text-muted flex items-center justify-between">
          <span>
            Open source · MIT · собрано с{" "}
            <a
              href="https://claude.com/claude-code"
              className="text-ink-2 hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Claude Code
            </a>
          </span>
          <span>
            Шрифты:{" "}
            <a
              href="https://fonts.google.com"
              className="text-ink-2 hover:text-ink"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Fonts
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
