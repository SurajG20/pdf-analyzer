import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PageGrid } from './page-grid'

vi.mock('@/lib/pdf', () => ({
  renderPageToCanvas: vi.fn(async () =>
    Object.assign(document.createElement('canvas'), { width: 100, height: 140 })
  ),
  hasPdfMagic: () => false,
}))

describe('PageGrid', () => {
  beforeEach(() => vi.clearAllMocks())

  const props = {
    url: 'http://api.test/files/d',
    pageCount: 4,
    selected: [2, 1] as number[],
    disabled: false,
    onToggle: vi.fn(),
    onReorder: vi.fn(),
  }

  it('renders one card per page', () => {
    render(<PageGrid {...props} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getAllByText(/^0[1-4]$/)).toHaveLength(4)
  })

  it('shows the output order badge on selected pages', () => {
    render(<PageGrid {...props} />)
    expect(screen.getByRole('checkbox', { name: /Remove page 1/ })).toHaveTextContent('no. 2 of 2')
    expect(screen.getByRole('checkbox', { name: /Remove page 2/ })).toHaveTextContent('no. 1 of 2')
    expect(screen.getByRole('checkbox', { name: /Add page 3/ })).toBeInTheDocument()
  })

  it('tells the app when a page is toggled', () => {
    render(<PageGrid {...props} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Add page 3/ }))
    expect(props.onToggle).toHaveBeenCalledWith(3)
  })

  it('reports a drop of one selected page onto another', () => {
    render(<PageGrid {...props} />)
    const from = screen.getByText('02').closest('[data-page="2"]')!
    const onto = screen.getByText('01').closest('[data-page="1"]')!
    fireEvent.dragStart(from)
    fireEvent.dragEnter(onto)
    // selection order is [2, 1]: moving page 2 onto page 1 => from 0 to 1
    expect(props.onReorder).toHaveBeenCalledWith(0, 1)
  })

  it('ignores drags between unselected pages', () => {
    render(<PageGrid {...props} />)
    const p3 = screen.getByText('03').closest('[data-page="3"]')!
    const p4 = screen.getByText('04').closest('[data-page="4"]')!
    fireEvent.dragStart(p3)
    fireEvent.dragEnter(p4)
    expect(props.onReorder).not.toHaveBeenCalled()
  })
})