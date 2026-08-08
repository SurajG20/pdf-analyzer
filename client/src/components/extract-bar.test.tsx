import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExtractBar } from './extract-bar'

describe('ExtractBar', () => {
  it('explains what to do when nothing is selected', () => {
    render(<ExtractBar count={0} extracting={false} disabled={false} onExtract={vi.fn()} />)
    expect(screen.getByText(/Pick at least one page/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gather pages/ })).toBeDisabled()
  })

  it('reports the size of the selection', () => {
    render(<ExtractBar count={3} extracting={false} disabled={false} onExtract={vi.fn()} />)
    expect(screen.getByLabelText('Pages selected')).toHaveTextContent('3')
    expect(screen.getByText(/pages in the booklet/)).toBeInTheDocument()
  })

  it('submits the chosen output name', async () => {
    const onExtract = vi.fn()
    const user = userEvent.setup()
    render(<ExtractBar count={2} extracting={false} disabled={false} onExtract={onExtract} />)

    await user.type(screen.getByLabelText('Name of the output file'), 'cover letters')
    await user.click(screen.getByRole('button', { name: /Gather pages/ }))
    expect(onExtract).toHaveBeenCalledWith('cover letters')
  })

  it('submits with an empty name when the user left it blank', async () => {
    const onExtract = vi.fn()
    const user = userEvent.setup()
    render(<ExtractBar count={1} extracting={false} disabled={false} onExtract={onExtract} />)
    await user.click(screen.getByRole('button', { name: /Gather pages/ }))
    expect(onExtract).toHaveBeenCalledWith('')
  })

  it('locks the form while extracting', async () => {
    const onExtract = vi.fn()
    render(<ExtractBar count={1} extracting disabled={false} onExtract={onExtract} />)
    expect(screen.getByRole('button', { name: /Gathering/ })).toBeDisabled()
    await waitFor(() => expect(onExtract).not.toHaveBeenCalled())
  })
})