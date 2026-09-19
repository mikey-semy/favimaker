# favimaker

Браузерный генератор фавиконок и прочей мелочи для `<head>`: текст, эмодзи или
картинка → полный набор иконок, манифест, картинка для соцсетей и готовый
сниппет — одним ZIP.

## Планы

Название рабочее: проект может вырасти за пределы иконок.

| Документ | О чём |
|---|---|
| [ROADMAP](docs/ROADMAP.md) | **когда** — четыре квартала с проверками делом |
| [FEATURES](docs/FEATURES.md) | **что** — каждая возможность: вход, выход, признак готовности |
| [SPRINT-1](docs/SPRINT-1.md) | **как** — первые пятнадцать дней по одному дню |
| [PLAN](docs/PLAN.md) | разбор состояния: что уже есть и почему настоящий пользователь — агент |

## Зачем он есть

**Потому что привычные генераторы отсюда не открываются.** Проверено
19.09.2026 с российского адреса:

| Сервис | Ответ |
|---|---|
| `favicon.io` | таймаут, имя резолвится — ответа нет |
| `realfavicongenerator.net` | то же |
| **`fi.equiply.ru`** | **200 за 0,27 с** |

Это и есть причина существования проекта: не «сделать лучше, чем у них», а
**закрыть нужду там, где их просто нет**. Отсюда и устройство — всё считается
в браузере, файл никуда не загружается, приложение ставится как PWA и работает
без сети.

## Что внутри

Работает **на `fi.equiply.ru`**. Всё считается в браузере: картинка никуда не
уходит, сервера у приложения нет.

**Иконки и фавиконы**

- источник: текст (любой шрифт Google), эмодзи, своя картинка (PNG/SVG/WebP);
- форма: квадрат, круг, скруглённый прямоугольник с настройкой радиуса;
- фон: сплошной, линейный или радиальный градиент, прозрачный;
- оформление: обводка текста, рамка, отступы;
- предпросмотр: живой canvas в четырёх размерах и эмуляция вкладки браузера.

**Что уезжает в ZIP** — заметно больше, чем «набор PNG»:

| Файл | Зачем |
|---|---|
| `favicon.ico` (16+32+48) | старые браузеры и закладки |
| `favicon-16/32.png`, `apple-touch-icon.png` | обычный набор |
| `android-chrome-192/512.png` + **maskable** | Android режет иконку по своей маске — без maskable обрежет по краю |
| `favicon.svg` и **тёмный вариант** | вкладка в тёмной теме |
| `safari-pinned-tab.svg` | закреплённая вкладка Safari — монохромный контур |
| **`og-image.png`** | картинка предпросмотра для соцсетей и мессенджеров |
| `site.webmanifest`, `browserconfig.xml` | PWA и плитки Windows |
| **экраны запуска iOS** | `apple-touch-startup-image` под каждое разрешение: Apple требует отдельный PNG и свой media-запрос, иначе экран запуска не покажется |
| `README.txt` и готовые `<link>` | вставить в `<head>` и не думать |

**И то, чего обычно нет у генераторов иконок**

- **Проверка чужого сайта** (`audit`): вставляешь HTML или адрес — приложение
  говорит, каких иконок и мета-тегов не хватает. Намеренно только диагностика,
  без автоправки.
- **Сниппеты под фреймворк**: для Next.js 13+ выдаётся `app/icon.tsx` через
  `ImageResponse` — иконка собирается на сборке, статику класть не нужно.
- **Проверка контраста**, наборы-заготовки, история правок с откатом.


## Стек

- Next.js 16 (App Router, `output: 'export'` — статический экспорт, никакого SSR)
- React 19, TypeScript, Tailwind CSS v4
- Zustand для config-store
- JSZip для архива
- Canvas API для рендеринга
- Lucide React для иконок
- yarn (а не npm, по конвенции репо)

Никакого бэкенда — всё генерируется в браузере. .ico собирается через свой энкодер (`src/lib/ico.ts`, ~50 строк без зависимостей).

## Локальная разработка

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # статический экспорт в out/
yarn lint
yarn typecheck
yarn format
yarn check        # lint + typecheck + format:check
```

## Деплой через Dokploy

Использует `docker-compose.yml` + сеть `dokploy-network`:

1. Dokploy → New Application → Provider: Github → этот репо → branch `main`
2. Build Type: **Docker Compose**
3. Save → Deploy
4. В Domains добавить нужный URL (sslip.io/nip.io если нет своего домена) → порт **3000**

Traefik из Dokploy автоматически подхватит сервис через File Provider — никаких labels указывать не надо. Сеть `dokploy-network` уже есть на сервере как external.

## Архитектура

```
src/
  app/
    layout.tsx           # Inter + JetBrains Mono via next/font
    page.tsx             # 3-col layout (Editor | Preview | Export)
    globals.css          # tokens + checker pattern + scrollbar
  components/
    Editor.tsx           # все контролы конфига
    Preview.tsx          # canvas-превью в 4 размерах + browser tab
    ExportPanel.tsx      # имя приложения + кнопка скачивания
    Field.tsx, inputs.tsx
  lib/
    types.ts             # FaviconConfig + DEFAULT_CONFIG
    store.ts             # Zustand + persist (localStorage)
    renderer.ts          # Canvas-рендер (чистая функция config → pixels)
    google-fonts.ts      # курируемый список + dynamic loader через <link>
    ico.ts               # pure-browser .ico encoder
    manifest.ts          # webmanifest + HTML-сниппет
    export.ts            # сборка ZIP через JSZip
    cn.ts                # tailwind-merge + clsx
```

## Лицензия

MIT
