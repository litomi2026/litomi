import '@test/setup.dom'

import type { ReactNode } from 'react'

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, mock } from 'bun:test'

import type { GETV1MeResponse } from '@/backend/api/v1/me'

import { AdultState } from '@/utils/adult-verification'

import type { JuicyAdsLayoutNode } from '../types'

import { AD_SLOTS } from '../constants'

const useMountedMock = mock(() => true)
const useMeQueryMock = mock<
  () => {
    data: GETV1MeResponse | null | undefined
  }
>(() => ({
  data: undefined,
}))
const useNonAdultGateMock = mock<() => AdultState>(() => AdultState.NOT_ADULT)

mock.module('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <span data-href={href} role="link" {...props}>
      {children}
    </span>
  ),
}))

mock.module('@/components/LoginPageLink', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <span className={className} data-href="/auth/login" data-testid="login-link" role="link">
      {children}
    </span>
  ),
}))

mock.module('@/hook/useMounted', () => ({
  default: useMountedMock,
}))

mock.module('@/query/useMeQuery', () => ({
  default: useMeQueryMock,
}))

mock.module('../../../../hook/useNonAdultGate', () => ({
  default: useNonAdultGateMock,
}))

mock.module('../JuicyAdsScript', () => ({
  default: () => <div data-testid="juicy-script" />,
}))

mock.module('../JuicyAdsSlot', () => ({
  default: ({ adSlotId, className, zoneId }: { adSlotId: string; className?: string; zoneId: number }) => (
    <div className={className} data-slot-id={adSlotId} data-testid="juicy-slot" data-zone-id={zoneId} />
  ),
}))

const { default: NonAdultJuicyAdsBanner } = await import('../NonAdultJuicyAdsBanner')

afterEach(() => {
  cleanup()
  useMountedMock.mockReset()
  useMeQueryMock.mockReset()
  useNonAdultGateMock.mockReset()
  useMountedMock.mockImplementation(() => true)
  useMeQueryMock.mockImplementation(() => ({
    data: undefined,
  }))
  useNonAdultGateMock.mockImplementation(() => AdultState.NOT_ADULT)
})

describe('NonAdultJuicyAdsBanner', () => {
  it('renders the default copy and layout for guests', () => {
    const { getAllByTestId, getByTestId, getByText } = render(<NonAdultJuicyAdsBanner />)

    expect(getByText('광고 수익은 서비스 운영에 사용돼요.')).not.toBeNull()
    expect(getByTestId('juicy-script')).not.toBeNull()
    expect(getAllByTestId('juicy-slot').length).toBeGreaterThan(1)
    expect(getByTestId('login-link')).not.toBeNull()
  })

  it('renders custom layouts with nested groups', () => {
    const customLayout: readonly JuicyAdsLayoutNode[] = [
      { type: 'slot', slot: AD_SLOTS.BANNER_300X100, className: 'custom-slot' },
      {
        type: 'group',
        className: 'custom-group',
        children: [{ type: 'slot', slot: AD_SLOTS.BANNER_308X286_2 }],
      },
    ]

    useMeQueryMock.mockImplementation(() => ({
      data: {
        id: 1,
        loginId: 'tester',
        name: 'alice',
        nickname: 'Alice',
        imageURL: null,
        adultVerification: { required: true, status: 'unverified' },
      },
    }))

    const { getAllByTestId, getByRole, getByText } = render(
      <NonAdultJuicyAdsBanner layout={customLayout} title="커스텀 광고" />,
    )

    const slots = getAllByTestId('juicy-slot')

    expect(getByText('커스텀 광고')).not.toBeNull()
    expect(slots).toHaveLength(2)
    expect(slots[0]?.getAttribute('data-slot-id')).toBe(AD_SLOTS.BANNER_300X100.id)
    expect(document.querySelector('.custom-group')).not.toBeNull()
    expect(getByRole('link', { name: '익명 성인인증' }).getAttribute('data-href')).toBe('/@alice/settings#adult')
  })

  it('returns null while hidden or before mount', () => {
    useNonAdultGateMock.mockImplementation(() => AdultState.ADULT)

    const { rerender, container } = render(<NonAdultJuicyAdsBanner />)

    expect(container.innerHTML).toBe('')

    useNonAdultGateMock.mockImplementation(() => AdultState.NOT_ADULT)
    useMountedMock.mockImplementation(() => false)

    rerender(<NonAdultJuicyAdsBanner />)

    expect(container.innerHTML).toBe('')
  })

  it('stretches the ad row so slot widths stay resolvable in centered layouts', () => {
    const { getAllByTestId } = render(<NonAdultJuicyAdsBanner className="items-center justify-center" />)

    expect(getAllByTestId('juicy-slot')[0]?.parentElement?.className).toContain('self-stretch')
  })
})
