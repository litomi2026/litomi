import { describe, expect, test } from 'bun:test'

import { appendViewToPath, getViewFromSearchParams, setViewToSearchParams, View } from './param'

describe('view search params helpers', () => {
  test('view=img일 때만 이미지 모드로 해석한다', () => {
    expect(getViewFromSearchParams(new URLSearchParams('view=img'))).toBe(View.IMAGE)
    expect(getViewFromSearchParams(new URLSearchParams('view=card'))).toBe(View.CARD)
    expect(getViewFromSearchParams(new URLSearchParams('view=unexpected'))).toBe(View.CARD)
    expect(getViewFromSearchParams(new URLSearchParams(''))).toBe(View.CARD)
  })

  test('이미지 모드는 쿼리에 view를 남기고 카드 모드는 제거한다', () => {
    expect(setViewToSearchParams(new URLSearchParams('sort=recent'), View.IMAGE).toString()).toBe('sort=recent&view=img')
    expect(setViewToSearchParams(new URLSearchParams('sort=recent&view=img'), View.CARD).toString()).toBe('sort=recent')
  })

  test('링크 생성 시 이미지 모드에서만 view 쿼리를 붙인다', () => {
    expect(appendViewToPath('/ranking/view/day', View.IMAGE)).toBe('/ranking/view/day?view=img')
    expect(appendViewToPath('/ranking/view/day', View.CARD)).toBe('/ranking/view/day')
  })
})
