"use client";

import * as React from "react";
import { ICON_LIBRARY } from "@/lib/icons";
import { useConfig } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { TextInput } from "./inputs";
import { Slider } from "./inputs";
import { Field, FieldRow } from "./Field";
import { ColorInput } from "./inputs";
import { cn } from "@/lib/cn";

type LucideIconRecord = Record<
  string,
  React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
>;

// Кэшируем все иконки lucide-react после первой загрузки (~1500 icons).
// Lazy-импорт чтобы не тащить ~1MB в начальный bundle.
let cachedIcons: LucideIconRecord | null = null;
let cachedAllNames: string[] | null = null;

async function loadAllIcons(): Promise<{
  icons: LucideIconRecord;
  names: string[];
}> {
  if (cachedIcons && cachedAllNames) {
    return { icons: cachedIcons, names: cachedAllNames };
  }
  const mod = await import("lucide-react");
  const record = mod as unknown as LucideIconRecord;
  // Иконки в lucide-react — это forwardRef-объекты (не plain functions),
  // поэтому фильтруем только по имени PascalCase. Не-иконочные хелперы
  // вроде LucideIcon / createLucideIcon тоже пройдут, но они не рендерятся
  // как кнопки в гриде — IconButton просто покажет fallback.
  const NON_ICON = new Set([
    "createLucideIcon",
    "Icon",
    "LucideIcon",
    "icons",
    "default",
    "LucideProps",
  ]);
  const names = Object.keys(record)
    .filter((k) => /^[A-Z][a-zA-Z0-9]*$/.test(k) && !NON_ICON.has(k))
    .sort();
  cachedIcons = record;
  cachedAllNames = names;
  return { icons: record, names };
}

const PAGE_SIZE = 120;

export function IconPicker() {
  const { config, set } = useConfig();
  const t = useT();
  const [search, setSearch] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [allIcons, setAllIcons] = React.useState<{
    icons: LucideIconRecord;
    names: string[];
  } | null>(cachedIcons && cachedAllNames ? { icons: cachedIcons, names: cachedAllNames } : null);
  const [loading, setLoading] = React.useState(false);

  // Загрузка полного каталога — обработчик клика, а не useEffect:
  // React 19 не любит синхронные setState в эффектах.
  const handleToggleShowAll = async () => {
    const next = !showAll;
    setShowAll(next);
    setVisibleCount(PAGE_SIZE); // сброс пагинации при смене режима
    if (next && !allIcons && !loading) {
      setLoading(true);
      try {
        const data = await loadAllIcons();
        setAllIcons(data);
      } finally {
        setLoading(false);
      }
    }
  };

  const iconsRecord = allIcons?.icons ?? null;

  // Что показываем: курируемое или всё
  const displayedNames = React.useMemo(() => {
    if (showAll && allIcons) {
      let list = allIcons.names;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((n) => n.toLowerCase().includes(q));
      }
      return list;
    }
    // Курируемый набор
    const curated = ICON_LIBRARY.flatMap((g) =>
      g.names.map((n) => ({ name: n, group: g.category })),
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return curated.filter((i) => i.name.toLowerCase().includes(q)).map((i) => i.name);
    }
    return curated.map((i) => i.name);
  }, [showAll, allIcons, search]);

  const visible = displayedNames.slice(0, visibleCount);

  // Pagination сбрасываем явно в обработчиках search/showAll (ниже),
  // не через эффекты — React 19 не любит cascading renders.
  const onSearchChange = (v: string) => {
    setSearch(v);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-3">
      <FieldRow>
        <Field label={t("field.textColor")}>
          <ColorInput value={config.textColor} onChange={(v) => set("textColor", v)} />
        </Field>
        <Field label={t("field.strokeWidth")} hint={`${config.iconStrokeWidth}px`}>
          <Slider
            value={config.iconStrokeWidth}
            onChange={(v) => set("iconStrokeWidth", v)}
            min={1}
            max={4}
            step={0.5}
          />
        </Field>
      </FieldRow>

      <TextInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`${t("fonts.search")} (${displayedNames.length})`}
      />

      <button
        type="button"
        onClick={handleToggleShowAll}
        className="w-full text-xs text-muted hover:text-ink-2 transition-colors text-center py-1"
        disabled={loading}
      >
        {showAll ? t("btn.curatedIcons") : loading ? t("btn.loadingIcons") : t("btn.loadAllIcons")}
      </button>

      {showAll && !iconsRecord ? (
        <div className="text-center text-xs text-muted py-6">{loading ? "…" : ""}</div>
      ) : (
        <CuratedOrAllGrid
          iconsRecord={iconsRecord}
          showAll={showAll}
          search={search}
          visible={visible}
          selectedName={config.iconName}
          onSelect={(name) => set("iconName", name)}
        />
      )}

      {visibleCount < displayedNames.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full text-xs text-muted hover:text-ink-2 transition-colors text-center py-2 border border-line rounded-[var(--r-md)] hover:bg-surface-2"
        >
          {t("btn.showMore")} ({displayedNames.length - visibleCount})
        </button>
      )}
    </div>
  );
}

function CuratedOrAllGrid({
  iconsRecord,
  showAll,
  search,
  visible,
  selectedName,
  onSelect,
}: {
  iconsRecord: LucideIconRecord | null;
  showAll: boolean;
  search: string;
  visible: string[];
  selectedName: string;
  onSelect: (name: string) => void;
}) {
  // В курируемом режиме показываем категории если нет поиска
  if (!showAll && !search.trim()) {
    return <CuratedByCategory selectedName={selectedName} onSelect={onSelect} />;
  }
  return (
    <div className="max-h-72 overflow-y-auto">
      <div className="grid grid-cols-6 gap-1">
        {visible.map((name) => (
          <IconButton
            key={name}
            name={name}
            iconsRecord={iconsRecord}
            selected={selectedName === name}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

/** Lazy-loaded компонент для одной иконки в режиме "All". */
function IconButton({
  name,
  iconsRecord,
  selected,
  onSelect,
}: {
  name: string;
  iconsRecord: LucideIconRecord | null;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  // В курируемом режиме iconsRecord = null → импортируем lucide-react статически
  // (он у нас и так через renderer.ts dynamically loaded когда нужно)
  const [LucideMod, setLucideMod] = React.useState<LucideIconRecord | null>(iconsRecord);
  React.useEffect(() => {
    if (LucideMod) return;
    import("lucide-react").then((m) => setLucideMod(m as unknown as LucideIconRecord));
  }, [LucideMod]);

  const Icon = LucideMod?.[name];

  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      title={name}
      className={cn(
        "flex items-center justify-center aspect-square rounded-[var(--r-sm)] transition-colors text-ink-2 hover:bg-surface-2 hover:text-ink",
        selected && "ring-2 ring-accent bg-surface-2 text-ink",
      )}
    >
      {Icon ? <Icon size={20} strokeWidth={2} /> : <span className="size-4 bg-surface-2" />}
    </button>
  );
}

/** Курируемые иконки по категориям — обычный режим. */
function CuratedByCategory({
  selectedName,
  onSelect,
}: {
  selectedName: string;
  onSelect: (name: string) => void;
}) {
  const t = useT();
  return (
    <div className="max-h-72 overflow-y-auto space-y-3 -mx-1 px-1">
      {ICON_LIBRARY.map((group) => (
        <div key={group.category}>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-1.5">
            {t(group.category as Parameters<typeof t>[0])}
          </p>
          <div className="grid grid-cols-6 gap-1">
            {group.names.map((name) => (
              <IconButton
                key={name}
                name={name}
                iconsRecord={null}
                selected={selectedName === name}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
