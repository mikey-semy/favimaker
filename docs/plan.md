# План развития favimaker

Канбан-источник истины: Plane, проект **`void`**, label **`favimaker`**.
Этот файл — зеркало для офлайн-чтения и порядка работы.

## Workflow

- Один feature = один PR с базы `main`.
- Имя ветки: `feat/{плейн-id}-короткое-описание` (например `feat/void-11-svg-favicon`).
- В описании PR ссылка на Plane-issue + acceptance criteria копипастом.
- Мерж только через review и фиксы; squash при мерже.
- После мержа: ветка удаляется, issue переводится в Done в Plane.

## Очерёдность (top-down)

Приоритеты: ★★ high · ★ medium · · low. Зависимости в скобках.

### Export — генерация

| #          | Title                                             | Prio | Deps     |
| ---------- | ------------------------------------------------- | ---- | -------- |
| VOID-11    | SVG favicon export                                | ★★   | —        |
| VOID-12    | Safari pinned-tab.svg (monochrome)                | ★    | VOID-11  |
| VOID-13    | Apple touch icon variants (120, 152, 167)         | ·    | —        |
| VOID-14    | Dark-mode favicon variant                         | ★    | —        |
| VOID-15    | PWA iOS splash screens                            | ·    | —        |

### Social / SEO

| #          | Title                                              | Prio | Deps    |
| ---------- | -------------------------------------------------- | ---- | ------- |
| VOID-16    | OG-image / Twitter card generator (1200×630)       | ★★   | —       |
| VOID-17    | Full meta-tags head block                          | ★    | VOID-16 |
| VOID-18    | Manifest validator (audit by URL)                  | ·    | —       |

### Editor UX

| #          | Title                                              | Prio | Deps    |
| ---------- | -------------------------------------------------- | ---- | ------- |
| VOID-19    | Undo/redo (Ctrl+Z / Ctrl+Shift+Z)                  | ★    | —       |
| VOID-20    | Auto-contrast WCAG warning                         | ★    | —       |
| VOID-21    | Eyedropper (color picker from image)               | ★    | —       |
| VOID-22    | Multi-line text / monogram                         | ·    | —       |
| VOID-23    | Drag&drop файла на канвас                          | ·    | —       |
| VOID-24    | Keyboard shortcuts                                 | ★    | VOID-19 |

### History extensions

| #          | Title                                              | Prio | Deps |
| ---------- | -------------------------------------------------- | ---- | ---- |
| VOID-25    | Pin entries                                        | ·    | —    |
| VOID-26    | Rename entries                                     | ·    | —    |
| VOID-27    | Import/export history JSON                         | ·    | —    |

### Framework integration snippets

| #          | Title                                                | Prio | Deps    |
| ---------- | ---------------------------------------------------- | ---- | ------- |
| VOID-28    | Next.js `app/icon.tsx` + `apple-icon.tsx` snippets   | ★★   | —       |
| VOID-29    | Astro/Nuxt/Vite/SvelteKit snippets                   | ·    | —       |
| VOID-30    | Vue/React inline-SVG component                       | ·    | VOID-11 |

### PWA (сам favimaker)

| #          | Title                                              | Prio | Deps |
| ---------- | -------------------------------------------------- | ---- | ---- |
| VOID-31    | favimaker as PWA (manifest + service worker)       | ★    | —    |

## Рекомендованный порядок

1. **VOID-11** SVG favicon — фундамент, разблокирует Safari pinned + Vue/React inline component.
2. **VOID-16** OG-image — главный value-add, новая аудитория.
3. **VOID-28** Next.js snippets — SEO-bonus, простая реализация.
4. **VOID-19 → VOID-24** Undo + keyboard shortcuts — UX-апгрейд для постоянных юзеров.
5. **VOID-20, VOID-21** Contrast warning + eyedropper — мелкие, но видимые.
6. **VOID-17** Full meta-tags — апгрейд после OG.
7. **VOID-14** Dark-mode favicon — изолированная фича, можно вставить в любой момент.
8. **VOID-31** PWA — поверх всего, не блокирует.
9. **VOID-12** Safari pinned — после SVG.
10. Остальное (VOID-13/15/18/22/23/25/26/27/29/30) — по запросу или когда core закрыт.

## AI

Намеренно вынесено за рамки: text-to-favicon через LLM, авто-извлечение бренд-цвета.
Это отдельный SaaS-уровень с бэкендом и расходами на API; вернуться когда core закрыт.

## Прогресс

Обновлять по мере мержа PR. Формат строки:
`- [x] VOID-XX — короткое описание · merged YYYY-MM-DD · #PR`

- [x] VOID-11 — SVG favicon export · merged 2026-05-26 · #2
- [x] VOID-12 — Safari pinned-tab.svg · merged 2026-05-26 · #3
- [x] VOID-19 — Undo/redo (Ctrl+Z) · merged 2026-05-26 · #4
- [x] VOID-20 — WCAG contrast badge · merged 2026-05-26 · #5
- [x] VOID-21 — Eyedropper в ColorInput · merged 2026-05-26 · #6
- [x] VOID-25 — Pin/unpin записей истории · merged 2026-05-26 · #7
