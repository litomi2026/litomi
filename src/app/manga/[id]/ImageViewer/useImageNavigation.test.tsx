import '@test/setup.dom'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

const warningMock = mock(() => {})

mock.module('sonner', () => ({
  toast: {
    warning: warningMock,
  },
}))

const { default: useImageNavigation } = await import('./useImageNavigation')
const { useImageIndexStore } = await import('./store/imageIndex')

function TestHarness() {
  useImageNavigation({ maxIndex: 9, offset: 1 })
  return <div />
}

beforeEach(() => {
  useImageIndexStore.setState({ imageIndex: 5 })
  warningMock.mockClear()
  window.history.replaceState({}, '', 'http://localhost:3000/manga/1?page=6')
})

afterEach(() => {
  cleanup()
  useImageIndexStore.setState({ imageIndex: 0 })
})

describe('useImageNavigation', () => {
  it('볼륨 올리기 키를 누르면 이전 페이지로 이동한다', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeUp' })

    expect(useImageIndexStore.getState().imageIndex).toBe(4)
  })

  it('볼륨 내리기 키를 누르면 다음 페이지로 이동한다', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeDown' })

    expect(useImageIndexStore.getState().imageIndex).toBe(6)
  })

  it('브라우저가 볼륨 단축키를 code 대신 key로 노출해도 동작한다', () => {
    render(<TestHarness />)

    fireEvent.keyDown(document, { key: 'VolumeDown' })

    expect(useImageIndexStore.getState().imageIndex).toBe(6)
  })

  it('첫 페이지에서 볼륨 올리기 키를 누르면 경고를 표시한다', () => {
    useImageIndexStore.setState({ imageIndex: 0 })
    render(<TestHarness />)

    fireEvent.keyDown(document, { code: 'AudioVolumeUp' })

    expect(useImageIndexStore.getState().imageIndex).toBe(0)
    expect(warningMock).toHaveBeenCalledWith('첫번째 페이지예요')
  })
})
