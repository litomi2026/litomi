import '@test/setup.dom'
import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

mock.module('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}))

const { default: ViewToggle } = await import('../ViewToggle')

describe('ViewToggle', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', 'http://localhost:3000/library/bookmark?sort=created_desc')
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('현재 pathname은 유지한 채 view 쿼리만 추가한다', () => {
    const view = render(<ViewToggle />)

    fireEvent.click(view.getByRole('radio', { name: '그림' }))

    expect(window.location.pathname).toBe('/library/bookmark')
    expect(new URLSearchParams(window.location.search).get('sort')).toBe('created_desc')
    expect(new URLSearchParams(window.location.search).get('view')).toBe('img')
  })

  test('카드 모드로 돌아가면 view 쿼리만 제거한다', () => {
    window.history.replaceState({}, '', 'http://localhost:3000/library/bookmark?sort=created_desc&view=img')
    const view = render(<ViewToggle />)

    fireEvent.click(view.getByRole('radio', { name: '카드' }))

    expect(window.location.pathname).toBe('/library/bookmark')
    expect(new URLSearchParams(window.location.search).get('sort')).toBe('created_desc')
    expect(new URLSearchParams(window.location.search).get('view')).toBeNull()
  })

  test('방향키로 다음 보기 방식으로 이동한다', () => {
    const view = render(<ViewToggle />)

    fireEvent.keyDown(view.getByRole('radio', { name: '카드' }), { key: 'ArrowRight' })

    expect(new URLSearchParams(window.location.search).get('view')).toBe('img')
  })
})
