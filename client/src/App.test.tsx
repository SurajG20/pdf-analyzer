import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

const fixtures = vi.hoisted(() => ({
  uploaded: {
    id: 'doc-1',
    originalName: 'notes.pdf',
    sizeBytes: 2048,
    mimeType: 'application/pdf',
    pageCount: 3,
    createdAt: new Date().toISOString(),
    extractedFrom: null,
    downloadUrl: '/api/files/doc-1',
  },
  extracted: {
    id: 'doc-2',
    originalName: 'notes-extracted.pdf',
    sizeBytes: 1024,
    mimeType: 'application/pdf',
    pageCount: 2,
    createdAt: new Date().toISOString(),
    extractedFrom: 'doc-1',
    downloadUrl: '/api/files/doc-2',
  },
}))

vi.mock('@/lib/pdf', () => ({
  renderPageToCanvas: vi.fn(async () => document.createElement('canvas')),
  hasPdfMagic: (bytes: Uint8Array) =>
    new TextDecoder('latin1').decode(bytes.subarray(0, 5)) === '%PDF-',
}))

vi.mock('@/lib/api', () => ({
  fileUrl: (doc: { downloadUrl: string }) => `http://api.test${doc.downloadUrl}`,
  uploadPdf: vi.fn(async () => ({ document: fixtures.uploaded })),
  extractPages: vi.fn(async () => ({ document: fixtures.extracted })),
}))

function pick() {
  fireEvent.change(screen.getByTestId('file-input'), {
    target: { files: [new File(['%PDF-1.7'], 'notes.pdf', { type: 'application/pdf' })] },
  })
}

describe('App', () => {
  it('walks the whole trip: upload, mark, extract, download', async () => {
    const { uploadPdf, extractPages } = await import('@/lib/api')

    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Pull the pages/)

    pick()
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Make your booklet/)
    )
    expect(uploadPdf).toHaveBeenCalledWith(expect.any(File))

    // three pages on the table, in folio order
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)

    fireEvent.click(screen.getByRole('checkbox', { name: /Add page 1/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Add page 3/ }))
    expect(screen.getByLabelText('Pages selected')).toHaveTextContent('2')

    fireEvent.click(screen.getByRole('button', { name: /Gather pages/ }))
    await waitFor(() => expect(extractPages).toHaveBeenCalledWith('doc-1', [1, 3], undefined))

    expect(await screen.findByRole('heading', { name: /The pages are gathered/ })).toBeInTheDocument()
    const link = screen.getByTestId('download-link') as HTMLAnchorElement
    expect(link.href).toBe('http://api.test/api/files/doc-2')

    screen.getByRole('button', { name: /Gather another/ }).click()
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows the upload error when the server refuses the file', async () => {
    const { uploadPdf } = await import('@/lib/api')
    vi.mocked(uploadPdf).mockRejectedValueOnce(
      new Error('This PDF is password-protected and cannot be read.')
    )

    render(<App />)
    pick()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/password-protected/))
  })

  it('keeps selection when an extraction fails', async () => {
    const { extractPages } = await import('@/lib/api')
    vi.mocked(extractPages).mockRejectedValueOnce(new Error('Page 9 does not exist'))

    render(<App />)
    pick()
    await waitFor(() => screen.getByRole('checkbox', { name: /Add page 1/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Add page 1/ }))
    fireEvent.click(screen.getByRole('button', { name: /Gather pages/ }))
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Remove page 1/ })).toBeInTheDocument())
  })
})