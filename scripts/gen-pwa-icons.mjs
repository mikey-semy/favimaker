/**
 * One-shot generator для PWA PNG-иконок favimaker'а.
 * Реквизит — public/favicon.svg (наша же ручная brand SVG). Рендерим
 * через @resvg/resvg-js в нужные размеры. Запускается:
 *
 *   yarn gen:icons
 *
 * Результат коммитится в public/. Re-run при обновлении brand'а.
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SVG_PATH = resolve("public/favicon.svg");
const OUT_DIR = resolve("public");

const SIZES = [
  { size: 180, name: "apple-touch-icon.png" }, // iOS home screen standard
  { size: 192, name: "icon-192.png" },
  { size: 512, name: "icon-512.png" },
  // Maskable: safe-zone 80%, обычно те же ассеты + manifest purpose: maskable.
  // Используем same source — Android учитывает safe-zone сам, контент в центре
  // и так попадает в неё (наш round-corner шаблон).
  { size: 192, name: "icon-maskable-192.png" },
  { size: 512, name: "icon-maskable-512.png" },
];

const svg = readFileSync(SVG_PATH);
for (const { size, name } of SIZES) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  const outPath = resolve(OUT_DIR, name);
  writeFileSync(outPath, png);
  console.log(`✓ ${name} (${size}×${size}, ${png.length} bytes)`);
}
