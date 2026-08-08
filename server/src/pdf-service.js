import { PDFDocument } from 'pdf-lib';

import { HttpError } from './http-error.js';

/** Detects the PDF magic bytes so we never trust the client's mimetype alone. */
export function isPdf(bytes) {
  const head = bytes.subarray(0, 5).toString('latin1');
  return head === '%PDF-';
}

export async function inspectPdf(bytes) {
  if (!isPdf(bytes)) {
    throw new HttpError(400, 'The uploaded file is not a valid PDF.');
  }
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    return { pageCount: doc.getPageCount() };
  } catch (err) {
    if (/encrypted/i.test(err?.message)) {
      throw new HttpError(400, 'This PDF is password-protected and cannot be read.');
    }
    throw new HttpError(400, 'The uploaded file is not a valid PDF.');
  }
}

/**
 * Builds a new PDF from 1-based page numbers. Order and duplicates in the
 * input are preserved, so callers can rearrange and repeat pages freely.
 */
export async function extractPages(bytes, pageNumbers, maxPages) {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
  const pageCount = src.getPageCount();

  if (!Array.isArray(pageNumbers) || pageNumbers.length === 0) {
    throw new HttpError(400, 'Select at least one page to extract.');
  }
  if (pageNumbers.length > maxPages) {
    throw new HttpError(400, `Too many pages. Keep the selection under ${maxPages}.`);
  }

  const indices = pageNumbers.map((raw) => {
    const page = Number(raw);
    if (!Number.isInteger(page)) {
      throw new HttpError(400, `"${raw}" is not a valid page number.`);
    }
    return page - 1; // API speaks 1-based page numbers
  });

  for (const idx of indices) {
    if (idx < 0 || idx >= pageCount) {
      throw new HttpError(400, `Page ${idx + 1} does not exist in this document (1–${pageCount}).`);
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, indices);
  copied.forEach((page) => out.addPage(page));
  return out.save();
}