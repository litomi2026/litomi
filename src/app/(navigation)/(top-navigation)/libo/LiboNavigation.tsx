'use client'

import { HelpCircle, History, PiggyBank, ShoppingBag, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

import AdsterraNativeBanner from '@/components/ads/AdsterraNativeBanner'
import LinkPending from '@/components/LinkPending'
import useMeQuery from '@/query/useMeQuery'

import { LIBO_PAGE_LAYOUT } from './constant'
import styles from './liboTheme.module.css'
import { usePointsQuery } from './usePointsQuery'

type Tab = 'earn' | 'history' | 'shop'

const TABS: { id: Tab; label: string; href: string; icon: ReactNode }[] = [
  { id: 'earn', label: '적립', href: '/libo', icon: <PiggyBank className="size-4" /> },
  { id: 'shop', label: '상점', href: '/libo/shop', icon: <ShoppingBag className="size-4" /> },
  { id: 'history', label: '내역', href: '/libo/history', icon: <History className="size-4" /> },
]

type Props = {
  children: ReactNode
}

export default function LiboNavigation({ children }: Props) {
  const pathname = usePathname()
  const activeTab = getActiveTab(pathname)
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const isLoggedIn = Boolean(me && !isMeLoading)
  const { data: points, isLoading: isPointsLoading } = usePointsQuery({ enabled: isLoggedIn })
  const isLoading = isMeLoading || (isLoggedIn && isPointsLoading)
  const balance = points?.balance ?? 0
  const totalEarned = points?.totalEarned ?? 0
  const totalSpent = points?.totalSpent ?? 0

  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      {/* 리보 잔액 */}
      <div aria-disabled={!isLoggedIn} className={`${styles.heroCard} rounded-2xl p-4 aria-disabled:opacity-80`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-300 mb-1">내 리보</p>
            <p className="text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums">
              {isLoggedIn ? (isLoading ? '...' : balance.toLocaleString()) : '—'}
              <span className="text-base font-medium text-zinc-300 ml-1">리보</span>
            </p>
          </div>
          <div className="size-12 rounded-full bg-white/7.5 border border-white/7 flex items-center justify-center">
            <TrendingUp className="size-6 text-zinc-200" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/7 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400">
          {!isLoggedIn && !isLoading ? (
            <p className="text-zinc-400/90">로그인하면 리보 잔액과 내역을 확인할 수 있어요</p>
          ) : (
            <>
              <span>총 적립 {isLoading ? '...' : isLoggedIn ? totalEarned.toLocaleString() : '—'} 리보</span>
              <span>총 사용 {isLoading ? '...' : isLoggedIn ? totalSpent.toLocaleString() : '—'} 리보</span>
            </>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div
        aria-label="리보 탭"
        className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        role="tablist"
      >
        {TABS.map((tab) => (
          <Link
            aria-selected={activeTab === tab.id}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white/70 hover:bg-white/4 hover:text-white/90 aria-selected:bg-white/5 aria-selected:text-white/90 aria-selected:shadow-[inset_0_-2px_0_var(--color-brand),inset_0_0_0_1px_rgba(255,255,255,0.08)] aria-selected:pointer-events-none transition"
            href={tab.href}
            key={tab.id}
            prefetch={false}
            role="tab"
          >
            <LinkPending className="size-4">{tab.icon}</LinkPending>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className={LIBO_PAGE_LAYOUT.panelReserved} role="tabpanel">
        {children}
      </div>

      {/* 안내 문구 */}
      <details className="text-xs text-zinc-500 rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none p-3 flex items-center gap-2 text-zinc-300 [&::-webkit-details-marker]:hidden">
          <HelpCircle className="size-4 text-zinc-400" />
          <span className="font-medium">안내</span>
        </summary>
        <div className="px-3 pb-3 space-y-4">
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">리보란?</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 10 리보가 적립돼요</li>
              <li>적립된 리보로 내 공간을 확장할 수 있어요</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">적립 주의사항</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 새 탭에서 광고 페이지가 열려요</li>
              <li>같은 광고: 1분 후 다시 클릭 가능</li>
              <li>하루 최대 100 리보 (10회) 적립 가능</li>
            </ul>
          </div>
        </div>
      </details>

      {/* NativeBanner */}
      <AdsterraNativeBanner className="w-full max-w-5xl mx-auto" />
    </div>
  )
}

function getActiveTab(pathname: string): Tab {
  if (pathname.startsWith('/libo/shop')) {
    return 'shop'
  }
  if (pathname.startsWith('/libo/history')) {
    return 'history'
  }
  return 'earn'
}
