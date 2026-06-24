import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { getViewFromSearchParams, View } from '@litomi/std'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { fireEvent, render } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'

import ViewToggle from '../ViewToggle'

function SearchParamsViewIndicator() {
  const searchParams = useSearchParams()

  return <span data-testid="view-indicator">{getViewFromSearchParams(searchParams)}</span>
}

describe('ViewToggle', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'http://localhost:3000/library/bookmark?sort=created_desc')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('현재 pathname은 유지한 채 view 쿼리만 추가한다', () => {
    const view = render(<ViewToggle />, { wrapper: createTestNavigationWrapper() })

    fireEvent.click(view.getByRole('radio', { name: '그림' }))

    expect(window.location.pathname).toBe('/library/bookmark')
    expect(new URLSearchParams(window.location.search).get('sort')).toBe('created_desc')
    expect(new URLSearchParams(window.location.search).get('view')).toBe('img')
  })

  test('카드 모드로 돌아가면 view 쿼리만 제거한다', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/library/bookmark?sort=created_desc&view=img')
    const view = render(<ViewToggle />, { wrapper: createTestNavigationWrapper() })

    fireEvent.click(view.getByRole('radio', { name: '카드' }))

    expect(window.location.pathname).toBe('/library/bookmark')
    expect(new URLSearchParams(window.location.search).get('sort')).toBe('created_desc')
    expect(new URLSearchParams(window.location.search).get('view')).toBeNull()
  })

  test('방향키로 다음 보기 방식으로 이동한다', () => {
    const view = render(<ViewToggle />, { wrapper: createTestNavigationWrapper() })

    fireEvent.keyDown(view.getByRole('radio', { name: '카드' }), { key: 'ArrowRight' })

    expect(new URLSearchParams(window.location.search).get('view')).toBe('img')
  })

  test('initialView가 주어지면 첫 렌더부터 해당 보기 방식이 선택된다', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/library/bookmark?sort=created_desc&view=img')

    const view = render(<ViewToggle initialView={View.IMAGE} />, { wrapper: createTestNavigationWrapper() })

    expect(view.getByRole('radio', { name: '그림' }).getAttribute('aria-checked')).toBe('true')
    expect(view.getByRole('radio', { name: '카드' }).getAttribute('aria-checked')).toBe('false')
  })

  test('보기 방식을 바꾸면 useSearchParams를 쓰는 다른 컴포넌트도 함께 갱신된다', () => {
    const view = render(
      <>
        <ViewToggle />
        <SearchParamsViewIndicator />
      </>,
      { wrapper: createTestNavigationWrapper() },
    )

    expect(view.getByTestId('view-indicator').textContent).toBe(View.CARD)

    fireEvent.click(view.getByRole('radio', { name: '그림' }))

    expect(view.getByTestId('view-indicator').textContent).toBe(View.IMAGE)
  })
})
