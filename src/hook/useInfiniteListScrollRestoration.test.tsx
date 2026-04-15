import '@test/setup.dom'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import useInfiniteListScrollRestoration from '@/hook/useInfiniteListScrollRestoration'
import {
  createScrollAnchorAttributes,
  setScrollRestoreInHistoryState,
  setScrollRestoreInStorage,
} from '@/utils/history-scroll-restoration'

type Item = {
  id: number
}

type TestComponentProps = {
  fetchNextPage?: () => Promise<unknown> | void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  items: Item[]
}

let currentScrollY = 0

function TestComponent({
  fetchNextPage = async () => undefined,
  hasNextPage = false,
  isFetchingNextPage = false,
  items,
}: TestComponentProps) {
  useInfiniteListScrollRestoration({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    restoreKey: 'test-list',
  })

  return (
    <div>
      {items.map((item, index) => (
        <div key={item.id} {...createScrollAnchorAttributes(item.id, index)}>
          manga-{item.id}
        </div>
      ))}
    </div>
  )
}

beforeEach(() => {
  cleanup()
  sessionStorage.clear()
  currentScrollY = 0

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 600,
  })

  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => currentScrollY,
  })

  window.scrollTo = ((options: number | ScrollToOptions, y?: number) => {
    if (typeof options === 'number') {
      currentScrollY = typeof y === 'number' ? y : options
      return
    }

    currentScrollY = Math.round(options.top ?? 0)
  }) as typeof window.scrollTo

  setDocumentHeight(4_000)
  window.history.replaceState({}, '', '/search?q=test')
})

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('useInfiniteListScrollRestoration', () => {
  test('restores using anchor position when a matching anchor is rendered', async () => {
    setScrollRestoreInHistoryState('test-list', {
      anchorId: '104',
      anchorIndex: 3,
      anchorOffset: 50,
      scrollY: 950,
      timestamp: Date.now(),
      url: '/search?q=test',
    })
    setScrollRestoreInStorage('/search?q=test')

    const view = render(<TestComponent items={[{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }]} />)

    applyAnchorLayout(view.container)

    await waitFor(() => {
      expect(currentScrollY).toBe(950)
    })
  })

  test('requests additional pages while the target anchor is missing', async () => {
    const fetchNextPage = mock(async () => undefined)

    setScrollRestoreInHistoryState('test-list', {
      anchorId: '205',
      anchorIndex: 4,
      anchorOffset: 40,
      scrollY: 1_240,
      timestamp: Date.now(),
      url: '/search?q=test',
    })
    setScrollRestoreInStorage('/search?q=test')

    const view = render(<TestComponent fetchNextPage={fetchNextPage} hasNextPage items={[{ id: 201 }, { id: 202 }]} />)

    applyAnchorLayout(view.container)

    await waitFor(() => {
      expect(fetchNextPage).toHaveBeenCalled()
    })
  })

  test('falls back to raw scrollY when no anchor can be found after the grace period', async () => {
    setScrollRestoreInHistoryState('test-list', {
      anchorId: '999',
      anchorIndex: 9,
      anchorOffset: 0,
      scrollY: 720,
      timestamp: Date.now(),
      url: '/search?q=test',
    })
    setScrollRestoreInStorage('/search?q=test')

    render(<TestComponent items={[{ id: 101 }, { id: 102 }]} />)

    await waitFor(
      () => {
        expect(currentScrollY).toBe(720)
      },
      { timeout: 2_000 },
    )
  })

  test('does nothing when the navigation was not triggered by history back/forward', async () => {
    setScrollRestoreInHistoryState('test-list', {
      anchorId: '104',
      anchorIndex: 3,
      anchorOffset: 50,
      scrollY: 950,
      timestamp: Date.now(),
      url: '/search?q=test',
    })

    const view = render(<TestComponent items={[{ id: 101 }, { id: 102 }, { id: 103 }, { id: 104 }, { id: 105 }]} />)

    applyAnchorLayout(view.container)
    await new Promise((resolve) => setTimeout(resolve, 700))

    expect(currentScrollY).toBe(0)
  })
})

function applyAnchorLayout(container: HTMLElement, rowHeight = 300, rowContentHeight = 220) {
  const anchors = Array.from(container.querySelectorAll<HTMLElement>('[data-scroll-anchor="true"]'))
  setDocumentHeight(anchors.length * rowHeight + 800)

  for (const [index, anchor] of anchors.entries()) {
    const absoluteTop = index * rowHeight

    anchor.getBoundingClientRect = () =>
      ({
        bottom: absoluteTop - currentScrollY + rowContentHeight,
        height: rowContentHeight,
        left: 0,
        right: 200,
        top: absoluteTop - currentScrollY,
        width: 200,
        x: 0,
        y: absoluteTop - currentScrollY,
        toJSON: () => '',
      }) as DOMRect
  }
}

function setDocumentHeight(height: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: height,
  })
  Object.defineProperty(document.body, 'scrollHeight', {
    configurable: true,
    value: height,
  })
  Object.defineProperty(document.documentElement, 'offsetHeight', {
    configurable: true,
    value: height,
  })
  Object.defineProperty(document.body, 'offsetHeight', {
    configurable: true,
    value: height,
  })
}
