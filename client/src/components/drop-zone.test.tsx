import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DropZone, validatePdfFile } from './drop-zone'

function pdfFile(name = 'doc.pdf', extra: Partial<File> = {}) {
  return new File(['%PDF-1.7\nhello'], name, { type: 'application/pdf', ...extra })
}

describe('validatePdfFile', () => {
  it('accepts a real pdf', () => {
    expect(validatePdfFile(pdfFile())).toBeNull()
  })

  it('rejects non-pdf mimetypes', () => {
    expect(validatePdfFile(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toMatch(/PDF/)
  })

  it('rejects files over 25 MB', () => {
    const big = new File([new ArrayBuffer(26 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' })
    expect(validatePdfFile(big)).toMatch(/25 MB/)
  })
})

describe('DropZone', () => {
  it('passes a valid file to onFile and shows no error', async () => {
    const onFile = vi.fn()
    render(<DropZone busy={false} serverError={null} onFile={onFile} />)

    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [pdfFile()] } })
    await waitFor(() => expect(onFile).toHaveBeenCalledOnce())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rejects a fake pdf even with a pdf name', async () => {
    const onFile = vi.fn()
    render(<DropZone busy={false} serverError={null} onFile={onFile} />)

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [new File(['this is not a pdf'], 'fake.pdf', { type: 'application/pdf' })] },
    })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/not a valid PDF/))
    expect(onFile).not.toHaveBeenCalled()
  })

  it('rejects a non-pdf mimetype without touching onFile', async () => {
    const onFile = vi.fn()
    render(<DropZone busy={false} serverError={null} onFile={onFile} />)

    fireEvent.change(screen.getByTestId('file-input'), {
      target: { files: [new File(['nope'], 'a.txt', { type: 'application/octet-stream' })] },
    })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/not a PDF/))
    expect(onFile).not.toHaveBeenCalled()
  })

  it('shows server errors from failed uploads', () => {
    render(<DropZone busy={false} serverError="The uploaded file is too large." onFile={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('too large')
  })

  it('does not open the picker while busy', () => {
    const { container } = render(<DropZone busy onFile={vi.fn()} serverError={null} />)
    const zone = container.querySelector('[role="button"]')
    expect(zone).toBeDefined()
    expect(zone?.className).toContain('pointer-events-none')
  })
})