'use client'

import { HelpCircle, History, PiggyBank, ShoppingBag, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'

import useMeQuery from '@/query/useMeQuery'

import { LIBO_PAGE_LAYOUT } from './constant'
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
      <div
        aria-disabled={!isLoggedIn}
        className="bg-linear-to-br from-amber-500/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30 aria-disabled:opacity-80"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 mb-1">내 리보</p>
            <p className="text-3xl font-bold text-amber-400">
              {isLoggedIn ? (isLoading ? '...' : balance.toLocaleString()) : '—'}
              <span className="text-lg ml-1">리보</span>
            </p>
          </div>
          <div className="size-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <TrendingUp className="size-6 text-amber-400" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-500/20 flex gap-1 text-xs text-zinc-400">
          {!isLoggedIn && !isLoading ? (
            <p className="text-xs text-zinc-500">로그인하면 리보 잔액과 내역을 확인할 수 있어요</p>
          ) : (
            <>
              <span>총 적립: {isLoading ? '...' : isLoggedIn ? totalEarned.toLocaleString() : '—'} 리보</span>
              <span>총 사용: {isLoading ? '...' : isLoggedIn ? totalSpent.toLocaleString() : '—'} 리보</span>
            </>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div aria-label="리보 탭" className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg" role="tablist">
        {TABS.map((tab) => (
          <Link
            aria-selected={activeTab === tab.id}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 aria-selected:bg-zinc-700 aria-selected:text-white aria-selected:pointer-events-none"
            href={tab.href}
            key={tab.id}
            prefetch={false}
            role="tab"
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className={LIBO_PAGE_LAYOUT.panelReserved} role="tabpanel">
        {children}
      </div>

      {/* 안내 문구 */}
      <details className="group text-xs text-zinc-500 bg-zinc-800/30 rounded-lg">
        <summary className="cursor-pointer list-none p-3 flex items-center gap-2 [&::-webkit-details-marker]:hidden">
          <HelpCircle className="size-4 transition-transform group-open:rotate-180" />
          안내
        </summary>
        <div className="px-3 pb-3 space-y-4">
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">리보란?</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 10 리보가 적립돼요</li>
              <li>적립된 리보로 내 공간을 확장할 수 있어요</li>
              <li>광고 수익은 서버 운영비 제외 후 전액 작가 후원에 사용돼요</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">적립 주의사항</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 새 탭에서 광고 페이지가 열려요</li>
              <li>같은 유저: 1분 후 다시 적립 가능</li>
              <li>같은 광고: 5분 후 다시 클릭 가능</li>
              <li>하루 최대 100 리보 (10회) 적립 가능</li>
            </ul>
          </div>
        </div>
      </details>
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
