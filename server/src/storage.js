import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { HttpError } from './http-error.js';

const PDF_EXTENSION = '.pdf';

/**
 * Disk-backed document store. Each document is a PDF plus a sidecar JSON
 * file of metadata, keyed by a random id. Metadata is read lazily so that
 * the original buffer only lives in memory while it is being uploaded.
 */
export class FileStorage {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  idFor() {
    return randomUUID();
  }

  pdfPath(id) {
    return path.join(this.dataDir, `${id}${PDF_EXTENSION}`);
  }

  metaPath(id) {
    return path.join(this.dataDir, `${id}.json`);
  }

  async save(meta, buffer) {
    await mkdir(this.dataDir, { recursive: true });
    await Promise.all([
      writeFile(this.pdfPath(meta.id), buffer),
      writeFile(this.metaPath(meta.id), JSON.stringify(meta, null, 2)),
    ]);
    return this.publicMeta(meta);
  }

  /** Returns the full stored meta plus the on-disk path of the PDF. */
  async getRegistration(id) {
    const meta = await this.getMeta(id);
    return { meta, path: this.pdfPath(id) };
  }

  async getMeta(id) {
    try {
      const raw = await readFile(this.metaPath(id), 'utf8');
      return JSON.parse(raw);
    } catch {
      throw new HttpError(404, `No document found for id "${id}".`);
    }
  }

  async remove(id) {
    const meta = await this.getMeta(id);
    await Promise.all([
      unlink(this.pdfPath(id)).catch(() => {}),
      unlink(this.metaPath(id)).catch(() => {}),
    ]);
    return this.publicMeta(meta);
  }

  /** The shape we are willing to send back to clients. */
  publicMeta(meta) {
    return {
      id: meta.id,
      originalName: meta.originalName,
      sizeBytes: meta.sizeBytes,
      mimeType: meta.mimeType,
      pageCount: meta.pageCount,
      createdAt: meta.createdAt,
      extractedFrom: meta.extractedFrom ?? null,
      downloadUrl: `/api/files/${meta.id}`,
    };
  }
}