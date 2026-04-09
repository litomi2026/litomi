import { render } from '@test/utils/render'
import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'

type SessionListModule = typeof import('./SessionList')

let SessionList: SessionListModule['default']

mock.module('next/navigation', () => ({
  useRouter: () => ({
    refresh: mock(() => {}),
  }),
}))

beforeAll(async () => {
  ;({ default: SessionList } = await import('./SessionList'))
})

afterAll(() => {
  mock.restore()
})

describe('SessionList', () => {
  test('빈 상태에서 로그인 유지 세션만 표시된다는 안내를 보여준다', () => {
    const view = render(<SessionList hasCurrentPersistentSession={false} sessions={[]} />)

    expect(view.getByText('로그인 유지 세션이 없어요')).toBeTruthy()
    expect(view.getAllByText(/로그인 유지 옵션으로 발급된 세션만 표시돼요/).length).toBeGreaterThan(0)
    expect(view.getByText(/현재 로그인은 로그인 유지를 사용하지 않아 목록에 표시되지 않아요/)).toBeTruthy()
  })

  test('현재 세션에는 현재 배지를 표시한다', () => {
    const view = render(
      <SessionList
        hasCurrentPersistentSession={true}
        sessions={[
          {
            id: 'family-1',
            createdAt: new Date('2026-04-09T00:00:00.000Z'),
            lastUsedAt: new Date('2026-04-09T01:00:00.000Z'),
            idleExpiresAt: new Date('2026-04-10T01:00:00.000Z'),
            userAgent: 'Mozilla/5.0 (Macintosh) Chrome/146.0.0.0 Safari/537.36',
            isCurrent: true,
          },
        ]}
      />,
    )

    expect(view.getByText('현재')).toBeTruthy()
    expect(view.getByText(/Chrome/)).toBeTruthy()
  })
})
