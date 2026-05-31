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

    expect(view.getByText('로그인 유지 중인 기기가 없어요')).toBeTruthy()
    expect(view.getAllByText(/여기에는 로그인 유지를 켠 기기만 보여요/).length).toBeGreaterThan(0)
    expect(view.getByText(/지금 사용 중인 기기는 로그인 유지를 켜지 않아 목록에 없어요/)).toBeTruthy()
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
            deviceLabel: 'Chrome macOS 데스크톱',
            isCurrent: true,
          },
        ]}
      />,
    )

    expect(view.getByText('현재')).toBeTruthy()
    expect(view.getByText(/Chrome/)).toBeTruthy()
  })
})
