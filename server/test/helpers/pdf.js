import { PDFDocument } from 'pdf-lib';

/**
 * Builds a tiny in-memory PDF. Each page gets a unique width (100 * n) so the
 * on-disk order of pages can be verified after extraction by reading sizes.
 */
export async function makePdf(count = 3) {
  const doc = await PDFDocument.create();
  for (let n = 1; n <= count; n += 1) {
    const page = doc.addPage([100 * n, 360]);
    page.drawText(`page ${n}`, { x: 60, y: 180, size: 22 });
  }
  return doc.save();
}

/** Returns the [width, height] of every page in order. */
export async function pdfPageSizes(buffer) {
  const doc = await PDFDocument.load(buffer);
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return [width, height];
  });
}