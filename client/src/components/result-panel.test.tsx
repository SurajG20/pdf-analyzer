import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultPanel } from './result-panel'

const document = {
  id: 'abc',
  originalName: 'micro-catalog.pdf',
  sizeBytes: 245760,
  mimeType: 'application/pdf',
  pageCount: 4,
  createdAt: new Date().toISOString(),
  extractedFrom: 'src',
  downloadUrl: '/api/files/abc',
}

describe('ResultPanel', () => {
  it('points the download at the new document with its name', () => {
    render(<ResultPanel document={document} onStartOver={vi.fn()} />)
    const link = screen.getByTestId('download-link') as HTMLAnchorElement
    expect(link.href).toBe('http://localhost:4000/api/files/abc')
    expect(link.download).toBe('micro-catalog.pdf')
  })

  it('summarises the output document', () => {
    render(<ResultPanel document={document} onStartOver={vi.fn()} />)
    expect(screen.getByText('micro-catalog.pdf')).toBeInTheDocument()
    expect(screen.getByText(/4 pages · 240 KB/)).toBeInTheDocument()
  })

  it('offers to start over', () => {
    const onStartOver = vi.fn()
    render(<ResultPanel document={document} onStartOver={onStartOver} />)
    screen.getByRole('button', { name: /Gather another/ }).click()
    expect(onStartOver).toHaveBeenCalled()
  })
})