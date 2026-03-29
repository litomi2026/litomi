import { describe, expect, test } from 'bun:test'

import { getViewerLink } from '../manga'

describe('getViewerLink', () => {
  test('소스 별로 뷰어 링크를 생성한다', () => {
    expect(getViewerLink(12345)).toBe('/manga/12345')
    expect(getViewerLink(67890)).toBe('/manga/67890')
    expect(getViewerLink(11111)).toBe('/manga/11111')
    expect(getViewerLink(99999)).toBe('/manga/99999')
  })
})
