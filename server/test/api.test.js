import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { createApp } from '../src/app.js';
import { makePdf, pdfPageSizes } from './helpers/pdf.js';

let app;
let dataDir;

beforeAll(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'gather-test-'));
  app = createApp({ dataDir });
});

afterAll(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

async function uploadPdf(count = 3, name = 'notes.pdf') {
  return request(app)
    .post('/api/files')
    .attach('file', Buffer.from(await makePdf(count)), { filename: name, contentType: 'application/pdf' });
}

describe('health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/files', () => {
  it('stores a pdf and returns its metadata', async () => {
    const res = await uploadPdf(3);
    expect(res.status).toBe(201);
    expect(res.body.document).toMatchObject({
      originalName: 'notes.pdf',
      mimeType: 'application/pdf',
      pageCount: 3,
      extractedFrom: null,
    });
    expect(res.body.document.id).toBeTruthy();
    expect(res.body.document.sizeBytes).toBeGreaterThan(0);
  });

  it('rejects a non-pdf mimetype', async () => {
    const res = await request(app)
      .post('/api/files')
      .attach('file', Buffer.from('hello world'), { filename: 'note.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.error).toContain('PDF');
  });

  it('rejects bytes that are not a real pdf even with a pdf name', async () => {
    const res = await request(app)
      .post('/api/files')
      .attach('file', Buffer.from('not a pdf at all'), { filename: 'fake.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not a valid PDF');
  });

  it('rejects a request without a file', async () => {
    const res = await request(app).post('/api/files');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/files/:id', () => {
  it('serves the stored bytes as a pdf', async () => {
    const { body } = await uploadPdf(2, 'service.pdf');
    const res = await request(app).get(`/api/files/${body.document.id}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    const doc = await PDFDocument.load(res.body);
    expect(doc.getPageCount()).toBe(2);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/files/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/files/:id/meta', () => {
  it('returns stored metadata', async () => {
    const { body } = await uploadPdf(4, 'meta.pdf');
    const res = await request(app).get(`/api/files/${body.document.id}/meta`);
    expect(res.status).toBe(200);
    expect(res.body.document).toMatchObject({ pageCount: 4, originalName: 'meta.pdf' });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/files/nope/meta');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/files/:id/extract', () => {
  it('extracts selected pages in order, duplicates allowed', async () => {
    const { body } = await uploadPdf(5, 'source.pdf');
    const res = await request(app)
      .post(`/api/files/${body.document.id}/extract`)
      .send({ pages: [5, 2, 2, 1] });
    expect(res.status).toBe(201);
    expect(res.body.document.pageCount).toBe(4);
    expect(res.body.document.extractedFrom).toBe(body.document.id);
    expect(res.body.downloadUrl).toBe(`/api/files/${res.body.document.id}`);

    const bytes = await request(app).get(res.body.downloadUrl);
    expect(await pdfPageSizes(bytes.body)).toEqual([
      [500, 360],
      [200, 360],
      [200, 360],
      [100, 360],
    ]);
  });

  it('applies a custom output name', async () => {
    const { body } = await uploadPdf(3, 'source.pdf');
    const res = await request(app)
      .post(`/api/files/${body.document.id}/extract`)
      .send({ pages: [1], name: 'first page' });
    expect(res.body.document.originalName).toBe('first page.pdf');
  });

  it('defaults the output name to "<original>-extracted.pdf"', async () => {
    const { body } = await uploadPdf(3, 'notes.pdf');
    const res = await request(app)
      .post(`/api/files/${body.document.id}/extract`)
      .send({ pages: [2] });
    expect(res.body.document.originalName).toBe('notes-extracted.pdf');
  });

  it('rejects out-of-range pages', async () => {
    const { body } = await uploadPdf(2);
    const res = await request(app)
      .post(`/api/files/${body.document.id}/extract`)
      .send({ pages: [3] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('does not exist');
  });

  it('rejects an empty or missing selection with a readable message', async () => {
    const { body } = await uploadPdf(2);
    for (const payload of [{ pages: [] }, {}, { pages: 'nope' }]) {
      const res = await request(app).post(`/api/files/${body.document.id}/extract`).send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least one page');
    }
  });

  it('returns 404 when the source document is unknown', async () => {
    const res = await request(app).post('/api/files/nope/extract').send({ pages: [1] });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/files/:id', () => {
  it('removes the document', async () => {
    const { body } = await uploadPdf(1);
    const res = await request(app).delete(`/api/files/${body.document.id}`);
    expect(res.status).toBe(204);
    const gone = await request(app).get(`/api/files/${body.document.id}`);
    expect(gone.status).toBe(404);
  });
});

describe('fallbacks', () => {
  it('answers unknown routes with a json 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});