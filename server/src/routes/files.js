import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import multer from 'multer';

import { config } from '../config.js';
import { FileStorage } from '../storage.js';
import { extractPages, inspectPdf } from '../pdf-service.js';
import { HttpError } from '../http-error.js';

function wrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

export function fileRoutes({ storage } = {}) {
  const router = Router();
  const store = storage ?? new FileStorage(config.dataDir);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new HttpError(415, 'Only PDF files are accepted.'));
      }
      cb(null, true);
    },
  });

  // POST /api/files — store an uploaded PDF and return its metadata.
  router.post(
    '/',
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return next(new HttpError(413, 'The uploaded file is too large.'));
        }
        next(err ?? undefined);
      });
    },
    (req, _res, next) => {
      if (!req.file) {
        return next(new HttpError(400, 'Attach a PDF file to upload.'));
      }
      next();
    },
    wrap(async (req, res) => {
      const { originalname: originalName, buffer } = req.file;
      const { pageCount } = await inspectPdf(buffer);

      const document = await store.save(
        {
          id: store.idFor(),
          originalName,
          sizeBytes: buffer.length,
          mimeType: 'application/pdf',
          pageCount,
          createdAt: new Date().toISOString(),
        },
        buffer
      );

      res.status(201).json({ document });
    })
  );

  // GET /api/files/:id — the original PDF document, for display in the browser.
  router.get(
    '/:id',
    wrap(async (req, res) => {
      const { meta, path } = await store.getRegistration(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${sanitize(meta.originalName)}"`);
      res.sendFile(path);
    })
  );

  // GET /api/files/:id/meta — metadata for one stored document.
  router.get(
    '/:id/meta',
    wrap(async (req, res) => {
      const meta = await store.getMeta(req.params.id);
      res.json({ document: meta });
    })
  );

  // POST /api/files/:id/extract — pages is a 1-based array; order is preserved.
  router.post(
    '/:id/extract',
    wrap(async (req, res) => {
      const { meta, path } = await store.getRegistration(req.params.id);
      const { pages, name } = req.body ?? {};

      const bytes = await extractPages(await readFile(path), pages, config.extractMaxPages);

      const document = await store.save(
        {
          id: store.idFor(),
          originalName: deriveName(meta.originalName, name),
          sizeBytes: bytes.length,
          mimeType: 'application/pdf',
          pageCount: Array.isArray(pages) ? pages.length : 0,
          extractedFrom: meta.id,
          createdAt: new Date().toISOString(),
        },
        Buffer.from(bytes)
      );

      res.status(201).json({
        document,
        downloadUrl: `/api/files/${document.id}`,
      });
    })
  );

  // DELETE /api/files/:id — remove a stored document.
  router.delete(
    '/:id',
    wrap(async (req, res) => {
      await store.remove(req.params.id);
      res.status(204).end();
    })
  );

  return router;
}

function deriveName(originalName, requestedName) {
  if (typeof requestedName !== 'string' || requestedName.trim() === '') {
    return originalName.replace(/\.pdf$/i, '') + '-extracted.pdf';
  }
  const clean = requestedName.trim().replace(/[^\w\-. ]/g, '_');
  return /\.pdf$/i.test(clean) ? clean : `${clean}.pdf`;
}

/** Strips characters that could break a Content-Disposition header. */
function sanitize(name) {
  return name.replace(/["\\\r\n]/g, '');
}