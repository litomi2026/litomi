import '@test/setup.dom'

import type { ReactElement, ReactNode } from 'react'

import { clearDocumentCookies, setAuthHintCookie } from '@test/utils/auth'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import type { JuicyAdsLayoutNode } from '../types'

import { AD_SLOTS } from '../constants'

mock.module('next/link', () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: ReactNode
    href: string
    prefetch?: boolean
  }) => (
    <span data-href={href} role="link" {...props}>
      {children}
    </span>
  ),
}))

mock.module('../JuicyAdsScript', () => ({
  default: () => <div data-testid="juicy-script" />,
}))

mock.module('../JuicyAdsSlot', () => ({
  default: ({ adSlotId, className, zoneId }: { adSlotId: string; className?: string; zoneId: number }) => (
    <div className={className} data-slot-id={adSlotId} data-testid="juicy-slot" data-zone-id={zoneId} />
  ),
}))

afterAll(() => {
  mock.restore()
})

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const { default: NonAdultJuicyAdsBanner } = await import('../NonAdultJuicyAdsBanner')

beforeEach(() => {
  clearDocumentCookies()
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
  window.history.replaceState({}, '', '/ads')
})

function renderBanner(node: ReactElement) {
  return renderWithTestQueryClient(node, {
    wrapper: createTestNavigationWrapper({
      pathname: '/ads',
      searchParams: new URLSearchParams(window.location.search),
    }),
  })
}

afterEach(() => {
  fetchController.restore()
  cleanup()
  clearDocumentCookies()
})

describe('NonAdultJuicyAdsBanner', () => {
  it('게스트에게 기본 문구와 레이아웃을 렌더링한다', async () => {
    const view = renderBanner(<NonAdultJuicyAdsBanner />)

    expect(await view.findByText('광고 수익은 서비스 운영에 사용돼요.')).not.toBeNull()
    expect(view.getByTestId('juicy-script')).not.toBeNull()
    expect(view.getAllByTestId('juicy-slot').length).toBeGreaterThan(1)
    expect(view.getByRole('link', { name: '로그인 후 익명 성인인증' }).getAttribute('data-href')).toContain(
      '/auth/login?redirect=',
    )
  })

  it('중첩 그룹이 있는 커스텀 레이아웃을 렌더링한다', async () => {
    const customLayout: readonly JuicyAdsLayoutNode[] = [
      { type: 'slot', slot: AD_SLOTS.BANNER_300X100, className: 'custom-slot' },
      {
        type: 'group',
        className: 'custom-group',
        children: [{ type: 'slot', slot: AD_SLOTS.BANNER_308X286_2 }],
      },
    ]

    setAuthHintCookie()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      response: () =>
        jsonResponse({
          id: 1,
          loginId: 'tester',
          name: 'alice',
          nickname: 'Alice',
          imageURL: null,
          adultVerification: { required: true, status: 'unverified' },
        }),
    })

    const view = renderBanner(<NonAdultJuicyAdsBanner layout={customLayout} title="커스텀 광고" />)

    await view.findByText('커스텀 광고')

    const slots = view.getAllByTestId('juicy-slot')

    expect(slots).toHaveLength(2)
    expect(slots[0]?.getAttribute('data-slot-id')).toBe(AD_SLOTS.BANNER_300X100.id)
    expect(document.querySelector('.custom-group')).not.toBeNull()
    expect(view.getByRole('link', { name: '익명 성인인증' }).getAttribute('data-href')).toBe('/@alice/settings#adult')
  })

  it('인증 상태가 아직 정해지지 않았으면 null을 반환한다', async () => {
    const pendingResponse = new Promise<Response>(() => {})

    setAuthHintCookie()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      response: () => pendingResponse,
    })

    const { container } = renderBanner(<NonAdultJuicyAdsBanner />)

    await waitFor(() => {
      expect(fetchController.fetchMock).toHaveBeenCalledTimes(1)
      expect(container.innerHTML).toBe('')
    })
  })

  it('성인 인증이 이미 끝났으면 null을 반환한다', async () => {
    setAuthHintCookie()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      response: () =>
        jsonResponse({
          id: 1,
          loginId: 'adult',
          name: 'adult',
          nickname: 'Adult',
          imageURL: null,
          adultVerification: { required: true, status: 'adult' },
        }),
    })

    const { container } = renderBanner(<NonAdultJuicyAdsBanner />)

    await waitFor(() => {
      expect(fetchController.fetchMock).toHaveBeenCalledTimes(1)
    })

    expect(container.innerHTML).toBe('')
  })

  it('가운데 정렬 레이아웃에서도 슬롯 너비를 계산할 수 있도록 광고 행을 늘린다', async () => {
    const view = renderBanner(<NonAdultJuicyAdsBanner className="items-center justify-center" />)

    await view.findAllByTestId('juicy-slot')

    expect(view.getAllByTestId('juicy-slot')[0]?.parentElement?.className).toContain('self-stretch')
  })
})
