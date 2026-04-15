import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
  clearPendingHistoryScrollRestore,
  getHistoryScrollRestoreSnapshot,
  getPendingHistoryScrollRestore,
  setHistoryScrollRestoreSnapshot,
} from '@/utils/history-scroll-restoration'

beforeEach(() => {
  sessionStorage.clear()
  window.history.replaceState({ preserved: 'value' }, '', '/search?q=test')
})

afterEach(() => {
  clearPendingHistoryScrollRestore()
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

  test('stores and reads scroll snapshots from history state', () => {
    setHistoryScrollRestoreSnapshot('search-results', {
      anchorId: '101',
      anchorIndex: 3,
      anchorOffset: 40,
      scrollY: 940,
      timestamp: 1234,
      url: '/search?q=test',
    })

    expect(getHistoryScrollRestoreSnapshot('search-results')).toEqual({
      anchorId: '101',
      anchorIndex: 3,
      anchorOffset: 40,
      scrollY: 940,
      timestamp: 1234,
      url: '/search?q=test',
    })
    expect(window.history.state).toMatchObject({ preserved: 'value' })
  })

  test('clears invalid pending scroll restore payloads', () => {
    sessionStorage.setItem('pendingScrollRestore', JSON.stringify({ invalid: true }))

    expect(getPendingHistoryScrollRestore()).toBeNull()
    expect(sessionStorage.getItem('pendingScrollRestore')).toBeNull()
  })
})
