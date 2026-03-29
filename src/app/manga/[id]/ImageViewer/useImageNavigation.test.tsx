import '@test/setup.dom'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

let currentImageIndex = 5

const navigateToImageIndexMock = mock((imageIndex: number) => {
  currentImageIndex = imageIndex
})
const getImageIndexMock = mock(() => currentImageIndex)
const warningMock = mock(() => {})

mock.module('./store/imageIndex', () => ({
  useImageIndexStore: () => ({
    getImageIndex: getImageIndexMock,
    navigateToImageIndex: navigateToImageIndexMock,
  }),
}))

mock.module('sonner', () => ({
  toast: {
    warning: warningMock,
  },
}))

const { default: useImageNavigation } = await import('./useImageNavigation')

function TestHarness() {
  useImageNavigation({ maxIndex: 9, offset: 1 })
  return <div />
}

beforeEach(() => {
  currentImageIndex = 5
  navigateToImageIndexMock.mockClear()
  getImageIndexMock.mockClear()
  warningMock.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('useImageNavigation', () => {
  it('moves to the previous page when AudioVolumeUp is pressed', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeUp' })

    expect(navigateToImageIndexMock).toHaveBeenCalledWith(4)
  })

  it('moves to the next page when AudioVolumeDown is pressed', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeDown' })

    expect(navigateToImageIndexMock).toHaveBeenCalledWith(6)
  })

  it('accepts browsers that expose the volume shortcut through key instead of code', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { key: 'VolumeDown' })

    expect(navigateToImageIndexMock).toHaveBeenCalledWith(6)
  })

  it('shows the first-page warning when volume up is pressed on the first page', () => {
    currentImageIndex = 0
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeUp' })

    expect(navigateToImageIndexMock).not.toHaveBeenCalled()
    expect(warningMock).toHaveBeenCalledWith('첫번째 페이지예요')
  })
})
