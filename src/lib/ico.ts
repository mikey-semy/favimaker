/**
 * Pure-browser ICO encoder. Принимает несколько PNG-Uint8Array разных размеров
 * и собирает их в один .ico-файл.
 *
 * Структура ICO:
 *   ICONDIR (6 bytes):
 *     2 bytes — reserved (0)
 *     2 bytes — type (1 = ICO)
 *     2 bytes — count of images
 *   ICONDIRENTRY (16 bytes each):
 *     1 byte  — width (0 = 256)
 *     1 byte  — height (0 = 256)
 *     1 byte  — color count (0 для >256 цветов)
 *     1 byte  — reserved (0)
 *     2 bytes — color planes (1)
 *     2 bytes — bits per pixel (32)
 *     4 bytes — image data size
 *     4 bytes — image data offset
 *   ... PNG payload каждой иконки ...
 *
 * Современные браузеры понимают ICO с PNG-payload (Vista+ формат).
 */
export type IcoImage = { size: number; png: Uint8Array };

export function encodeIco(images: IcoImage[]): Uint8Array {
  const headerSize = 6;
  const entrySize = 16;
  const totalHeader = headerSize + entrySize * images.length;

  const totalSize = totalHeader + images.reduce((acc, i) => acc + i.png.length, 0);
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type = ICO
  view.setUint16(4, images.length, true); // count

  let dataOffset = totalHeader;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const entryOffset = headerSize + i * entrySize;
    const dim = img.size >= 256 ? 0 : img.size;
    view.setUint8(entryOffset + 0, dim);
    view.setUint8(entryOffset + 1, dim);
    view.setUint8(entryOffset + 2, 0); // color count
    view.setUint8(entryOffset + 3, 0); // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, img.png.length, true); // image size
    view.setUint32(entryOffset + 12, dataOffset, true); // image offset

    buf.set(img.png, dataOffset);
    dataOffset += img.png.length;
  }

  return buf;
}
