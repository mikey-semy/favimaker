/**
 * Canvas-рендерер фавикона. Отрисовывает конфигурацию в заданном размере.
 * Чистая функция: один и тот же config → одинаковый pixel-output, не зависит
 * от React. Используется и для live-превью, и для финального экспорта.
 */
import type { FaviconConfig } from "./types";

/** Применить shape-клип на контекст (square / circle / rounded). */
function applyShapeClip(ctx: CanvasRenderingContext2D, size: number, config: FaviconConfig) {
  ctx.beginPath();
  if (config.shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  } else if (config.shape === "rounded") {
    const r = (config.borderRadiusPct / 100) * (size / 2);
    roundRect(ctx, 0, 0, size, size, r);
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.clip();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Нарисовать фон (solid / gradient / transparent). */
function drawBackground(ctx: CanvasRenderingContext2D, size: number, config: FaviconConfig) {
  if (config.bgMode === "transparent") return;
  if (config.bgMode === "solid") {
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, size, size);
    return;
  }
  // gradient
  const { from, to, direction } = config.bgGradient;
  let grad: CanvasGradient;
  if (direction === "radial") {
    grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  } else {
    const dirMap: Record<string, [number, number, number, number]> = {
      "to-r": [0, size / 2, size, size / 2],
      "to-l": [size, size / 2, 0, size / 2],
      "to-t": [size / 2, size, size / 2, 0],
      "to-b": [size / 2, 0, size / 2, size],
      "to-tr": [0, size, size, 0],
      "to-tl": [size, size, 0, 0],
      "to-br": [0, 0, size, size],
      "to-bl": [size, 0, 0, size],
    };
    const [x0, y0, x1, y1] = dirMap[direction] ?? dirMap["to-br"];
    grad = ctx.createLinearGradient(x0, y0, x1, y1);
  }
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

/** Нарисовать содержимое (текст / эмодзи / картинка). */
function drawContent(ctx: CanvasRenderingContext2D, size: number, config: FaviconConfig) {
  const padding = (config.paddingPct / 100) * size;
  const innerSize = size - padding * 2;

  if (config.source === "image" && config.imageDataUrl) {
    const img = (drawContent as unknown as { __cache?: Map<string, HTMLImageElement> }).__cache;
    // Картинки рисуются асинхронно через renderToCanvas, не здесь.
    void img;
    return;
  }

  const value = config.source === "emoji" ? config.emoji : config.text;
  if (!value) return;

  // Авто-подгонка кегля под inner-зону: считаем от пользовательского fontSizePct,
  // но если контент шире — уменьшаем чтобы влез с лёгким запасом.
  const baseFontSize = (config.fontSizePct / 100) * size;
  const fontFamily = config.source === "emoji" ? '"Segoe UI Emoji", "Apple Color Emoji", sans-serif' : config.fontFamily;

  ctx.font = `${config.fontWeight} ${baseFontSize}px "${fontFamily}", sans-serif`;
  const measured = ctx.measureText(value);
  const textWidth = measured.width;
  const scale = textWidth > innerSize ? innerSize / textWidth : 1;
  const finalFontSize = baseFontSize * scale;

  ctx.font = `${config.fontWeight} ${finalFontSize}px "${fontFamily}", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = `${config.letterSpacing}em` as unknown as string;

  if (config.shadow) {
    ctx.shadowColor = config.shadowColor;
    ctx.shadowBlur = (config.shadowBlur / 100) * size;
    ctx.shadowOffsetY = (config.shadowOffsetY / 100) * size;
  }

  if (config.textStrokeColor && config.textStrokeWidth > 0) {
    ctx.strokeStyle = config.textStrokeColor;
    ctx.lineWidth = (config.textStrokeWidth / 100) * size;
    ctx.strokeText(value, size / 2, size / 2);
  }

  ctx.fillStyle = config.textColor;
  ctx.fillText(value, size / 2, size / 2);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawBorder(ctx: CanvasRenderingContext2D, size: number, config: FaviconConfig) {
  if (!config.borderWidth) return;
  const w = (config.borderWidth / 100) * size;
  ctx.save();
  ctx.beginPath();
  if (config.shape === "circle") {
    ctx.arc(size / 2, size / 2, size / 2 - w / 2, 0, Math.PI * 2);
  } else if (config.shape === "rounded") {
    const r = (config.borderRadiusPct / 100) * (size / 2) - w / 2;
    roundRect(ctx, w / 2, w / 2, size - w, size - w, Math.max(0, r));
  } else {
    ctx.rect(w / 2, w / 2, size - w, size - w);
  }
  ctx.strokeStyle = config.borderColor;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();
}

/** Загрузить изображение из dataURL (кэшируется). */
const imageCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

/**
 * Главная функция рендера. Принимает уже созданный canvas нужного размера.
 * Возвращает Promise<void> — нужно await чтобы дождаться картинок.
 */
export async function renderToCanvas(
  canvas: HTMLCanvasElement,
  config: FaviconConfig,
): Promise<void> {
  const size = canvas.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  applyShapeClip(ctx, size, config);
  drawBackground(ctx, size, config);

  if (config.source === "image" && config.imageDataUrl) {
    try {
      const img = await loadImage(config.imageDataUrl);
      const padding = (config.paddingPct / 100) * size;
      const inner = size - padding * 2;
      const ratio = Math.min(inner / img.width, inner / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    } catch {
      // картинка не загрузилась — рендерим без неё
    }
  } else {
    drawContent(ctx, size, config);
  }

  ctx.restore();
  drawBorder(ctx, size, config);
}

/** Создать offscreen canvas нужного размера и отрендерить туда. Возвращает Blob (PNG). */
export async function renderToPngBlob(size: number, config: FaviconConfig): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  await renderToCanvas(canvas, config);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/png",
    );
  });
}
