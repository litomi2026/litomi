import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  clearScrollRestoration,
  getScrollRestoreFromHistoryState,
  getScrollRestoreFromStorage,
  setScrollRestoreInHistoryState,
} from '@/utils/history-scroll-restoration'

beforeEach(() => {
  sessionStorage.clear()
  window.history.replaceState({ preserved: 'value' }, '', '/search?q=test')
})

afterEach(() => {
  clearScrollRestoration()
  sessionStorage.clear()
})

describe('history-scroll-restoration', () => {
  test('native replaceState can keep existing state while changing url', () => {
    window.history.replaceState(window.history.state, '', '/search?q=test&view=img')

    expect(window.location.pathname).toBe('/search')
    expect(window.location.search).toBe('?q=test&view=img')
    expect(window.history.state).toEqual({
      preserved: 'value',
    })
  })

  test('stores and reads scroll restore positions from history state', () => {
    setScrollRestoreInHistoryState('search-results', {
      anchorId: '101',
      anchorIndex: 3,
      anchorOffset: 40,
      scrollY: 940,
      timestamp: 1234,
      url: '/search?q=test',
    })

    expect(getScrollRestoreFromHistoryState('search-results')).toEqual({
      anchorId: '101',
      anchorIndex: 3,
      anchorOffset: 40,
      scrollY: 940,
      timestamp: 1234,
      url: '/search?q=test',
    })
    expect(window.history.state).toMatchObject({ preserved: 'value' })
  })

  test('clears invalid scroll restore payloads', () => {
    sessionStorage.setItem('scrollRestore', JSON.stringify({ invalid: true }))

    expect(getScrollRestoreFromStorage()).toBeNull()
    expect(sessionStorage.getItem('scrollRestore')).toBeNull()
  })
})
