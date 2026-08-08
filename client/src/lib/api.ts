export type DocumentMeta = {
  id: string
  originalName: string
  sizeBytes: number
  mimeType: string
  pageCount: number
  createdAt: string
  extractedFrom: string | null
  downloadUrl: string
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'

class ApiError extends Error {}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') message = body.error
    } catch {
      /* keep the fallback message */
    }
    throw new ApiError(message)
  }
  return res.json() as Promise<T>
}

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export function fileUrl(doc: { downloadUrl: string }): string {
  return apiUrl(doc.downloadUrl)
}

export function uploadPdf(file: File): Promise<{ document: DocumentMeta }> {
  const body = new FormData()
  body.append('file', file)
  return fetch(apiUrl('/api/files'), { method: 'POST', body }).then((res) =>
    handle<{ document: DocumentMeta }>(res)
  )
}

export function extractPages(
  id: string,
  pages: number[],
  name?: string
): Promise<{ document: DocumentMeta }> {
  return fetch(apiUrl(`/api/files/${id}/extract`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pages, name: name?.trim() || undefined }),
  }).then((res) => handle<{ document: DocumentMeta }>(res))
}