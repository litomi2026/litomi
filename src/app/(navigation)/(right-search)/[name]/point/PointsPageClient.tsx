'use client'

import { Gift, HelpCircle, History, ShoppingBag, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import PointsShop from './PointsShop'
import RewardedAdSection from './RewardedAdSection'
import TransactionHistory from './TransactionHistory'
import { usePointsQuery } from './usePointsQuery'

type Tab = 'earn' | 'history' | 'shop'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'earn', label: '적립', icon: <Gift className="size-4" /> },
  { id: 'shop', label: '상점', icon: <ShoppingBag className="size-4" /> },
  { id: 'history', label: '내역', icon: <History className="size-4" /> },
]

export default function PointsPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>('earn')
  const { data: points, isLoading } = usePointsQuery()

  return (
    <div className="flex flex-col grow gap-4 p-4 max-w-prose mx-auto w-full md:p-8 md:gap-6">
      {/* 리보 잔액 */}
      <div className="bg-linear-to-br from-amber-500/20 to-orange-600/20 rounded-xl p-4 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 mb-1">내 리보</p>
            <p className="text-3xl font-bold text-amber-400">
              {isLoading ? '...' : (points?.balance.toLocaleString() ?? 0)}
              <span className="text-lg ml-1">리보</span>
            </p>
          </div>
          <div className="size-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <TrendingUp className="size-6 text-amber-400" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-500/20 flex gap-4 text-xs text-zinc-400">
          <span>총 적립: {isLoading ? '...' : (points?.totalEarned.toLocaleString() ?? 0)} 리보</span>
          <span>총 사용: {isLoading ? '...' : (points?.totalSpent.toLocaleString() ?? 0)} 리보</span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-lg" role="tablist">
        {TABS.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 aria-selected:bg-zinc-700 aria-selected:text-white"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="min-h-[200px]" role="tabpanel">
        {activeTab === 'earn' && <RewardedAdSection />}
        {activeTab === 'shop' && <PointsShop balance={points?.balance ?? 0} />}
        {activeTab === 'history' && <TransactionHistory />}
      </div>

      {/* 안내 문구 */}
      <details className="group text-xs text-zinc-500 bg-zinc-800/30 rounded-lg">
        <summary className="cursor-pointer list-none p-3 flex items-center gap-2 [&::-webkit-details-marker]:hidden">
          <HelpCircle className="size-4 transition-transform group-open:rotate-180" />
          리보란?
        </summary>
        <ul className="px-3 pb-3 space-y-1 list-disc list-inside marker:text-zinc-600">
          <li>리보는 서버 운영 비용을 지원하는 데 사용돼요</li>
          <li>광고 클릭 시 10 리보가 적립돼요</li>
          <li>적립된 리보로 서버 자원을 구매할 수 있어요</li>
        </ul>
      </details>
    </div>
  )
}
