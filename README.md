# favimaker

Браузерный favicon-генератор. Всё в одной странице: текст / эмодзи / картинка → набор иконок под все платформы + manifest + HTML-сниппет одним ZIP-архивом.

## Что внутри

- **Источник:** текст (любой Google-шрифт), эмодзи, кастомная картинка (PNG/SVG/WebP)
- **Форма:** квадрат / круг / скруглённый прямоугольник (с регулировкой радиуса)
- **Фон:** solid / линейный или радиальный градиент / прозрачный
- **Эффекты:** обводка текста, толщина бордера + цвет, padding
- **Превью:** живой canvas в 4 реальных размерах + эмуляция таба браузера + checker для прозрачности
- **Экспорт ZIP:**
  - `favicon.ico` (16 + 32 + 48 в одном файле, Vista+ PNG-payload)
  - `favicon-16x16.png`, `favicon-32x32.png`
  - `apple-touch-icon.png` (180×180)
  - `android-chrome-192x192.png`, `android-chrome-512x512.png`
  - `site.webmanifest` (theme/background-color авто из конфига)
  - `README.html-snippet.html` (готовые `<link>` для `<head>`)
  - `README.txt` (инструкция установки)
- **Share-ссылки:** конфиг в URL через `#config=base64(json)` — копируй и пришли коллеге, у него откроется та же иконка
- **Сохранение:** все настройки автоматически персистятся в `localStorage` (zustand persist)

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
