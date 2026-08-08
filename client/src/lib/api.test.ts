import { describe, expect, it, vi } from 'vitest'
import { apiUrl, extractPages, fileUrl, uploadPdf } from './api'

describe('api helpers', () => {
  it('joins url parts onto the api base', () => {
    expect(apiUrl('/api/files/x')).toBe('http://localhost:4000/api/files/x')
    expect(apiUrl('api/files/x')).toBe('http://localhost:4000/api/files/x')
  })

  it('builds absolute urls for documents', () => {
    expect(fileUrl({ downloadUrl: '/api/files/abc' })).toBe('http://localhost:4000/api/files/abc')
  })
})

describe('uploadPdf', () => {
  it('posts the file as multipart and returns the document', async () => {
    const body = { document: { id: '1', pageCount: 2 } }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => body })
    vi.stubGlobal('fetch', fetchMock)

    const file = new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' })
    await expect(uploadPdf(file)).resolves.toEqual(body)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:4000/api/files')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('file')).toBe(file)
    vi.unstubAllGlobals()
  })

  it('surfaces the server error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 413, json: async () => ({ error: 'The uploaded file is too large.' }),
    }))
    await expect(uploadPdf(new File(['x'], 'a.pdf'))).rejects.toThrow('too large')
    vi.unstubAllGlobals()
  })

  it('falls back to a generic message when the body is unparsable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error('bad body') } }))
    await expect(uploadPdf(new File(['x'], 'a.pdf'))).rejects.toThrow(/500/)
    vi.unstubAllGlobals()
  })
})

describe('extractPages', () => {
  it('sends pages and name as json', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ document: {} }) })
    vi.stubGlobal('fetch', fetchMock)
    await extractPages('doc', [3, 1], 'out')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/files/doc/extract')
    expect(JSON.parse(init.body as string)).toEqual({ pages: [3, 1], name: 'out' })
    vi.unstubAllGlobals()
  })
})