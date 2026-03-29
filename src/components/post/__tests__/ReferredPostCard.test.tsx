import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'bun:test'

import { render } from '../../../../test/utils/render'
import ReferredPostCard from '../ReferredPostCard'

afterEach(() => {
  cleanup()
})

describe('ReferredPostCard', () => {
  test('삭제된 리포스트 원글은 링크 없는 삭제 표시 카드로 렌더링한다', () => {
    const view = render(<ReferredPostCard referredPost={{ isDeleted: true }} />)

    expect(view.getByText('글이 삭제됐어요')).toBeTruthy()
    expect(view.queryByRole('link')).toBeNull()
  })

  test('존재하는 리포스트 원글은 링크 카드로 렌더링한다', () => {
    const view = render(
      <ReferredPostCard
        referredPost={{
          id: 10,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          content: '원본 글',
          author: { id: 1, imageURL: null, name: 'user1', nickname: 'User One' },
        }}
      />,
    )

    expect(view.getByRole('link')).toBeTruthy()
    expect(view.getByText('원본 글')).toBeTruthy()
  })
})
