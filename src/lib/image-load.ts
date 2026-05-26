"use client";

/**
 * Shared utilities для загрузки картинки из File → dataURL.
 * Используется DropZone'ом и Preview'ом (drag&drop поверх канваса).
 */

const IMAGE_MIME_PREFIX = "image/";

export type FileLoadResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: "not-an-image" | "read-error" };

/** Читает File как dataURL. Отвергает не-картинки. */
export function readImageAsDataUrl(file: File): Promise<FileLoadResult> {
  return new Promise((resolve) => {
    if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
      resolve({ ok: false, reason: "not-an-image" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ ok: true, dataUrl: reader.result });
      } else {
        resolve({ ok: false, reason: "read-error" });
      }
    };
    reader.onerror = () => resolve({ ok: false, reason: "read-error" });
    reader.readAsDataURL(file);
  });
}
