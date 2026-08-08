import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** Glue: a client-side validator mirroring the server's magic-bytes check. */
export function hasPdfMagic(bytes: Uint8Array): boolean {
  return new TextDecoder('latin1').decode(bytes.subarray(0, 5)) === '%PDF-'
}

const documents = new Map<string, Promise<pdfjs.PDFDocumentProxy>>()

function loadPdf(url: string): Promise<pdfjs.PDFDocumentProxy> {
  let loading = documents.get(url)
  if (!loading) {
    loading = pdfjs.getDocument({ url }).promise
    documents.set(url, loading)
  }
  return loading
}

/**
 * Renders a single page of the pdf at `url` into a detached canvas,
 * sized to fit `containerWidth` while keeping text crisp on retina
 * screens. Returns the canvas so the caller decides where it goes.
 */
export async function renderPageToCanvas(
  url: string,
  pageNumber: number,
  containerWidth: number
): Promise<HTMLCanvasElement> {
  const doc = await loadPdf(url)
  const page = await doc.getPage(pageNumber)

  const base = page.getViewport({ scale: 1 })
  const scale = containerWidth / base.width

  const viewport = page.getViewport({ scale })
  const ratio = Math.min(window.devicePixelRatio || 1, 2)

  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width * ratio)
  canvas.height = Math.floor(viewport.height * ratio)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = 'auto'

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')

  await page.render({
    canvas,
    viewport,
    transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
  }).promise

  return canvas
}