'use client'

import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import LoginGate from '@/components/LoginGate'
import useClipboard from '@/hook/useClipboard'
import useMeQuery from '@/query/useMeQuery'

import { DrawStage } from './_components/DrawStage'
import { Header } from './_components/Header'
import { HeroCard } from './_components/HeroCard'
import { LoadingState } from './_components/LoadingState'
import { RerollGate } from './_components/RerollGate'
import { StreakBanner } from './_components/StreakBanner'
import { LIBO_PAGE_LAYOUT } from './_components/styles'
import { TabNav } from './_components/TabNav'
import { CourseTab } from './_components/tabs/CourseTab'
import { FortuneTab } from './_components/tabs/FortuneTab'
import { SpecialTab } from './_components/tabs/SpecialTab'
import { generateFortune } from './_lib/generator'
import { buildShareText } from './_lib/shareText'
import {
  type FortuneStreak,
  getUserKey,
  MAX_REROLLS_PER_DAY,
  readDailyState,
  readStreak,
  touchStreak,
  writeDailyState,
} from './_lib/storage'
import type { FortuneTaste, SexFortuneTab } from './_lib/types'

type Props = {
  todayKey: string
}

export default function SexFortune({ todayKey }: Props) {
  const [activeTab, setActiveTab] = useState<SexFortuneTab>('fortune')
  const [streak, setStreak] = useState<FortuneStreak | null>(null)
  const [taste, setTaste] = useState<FortuneTaste | null>(null)
  const [userKey, setUserKey] = useState<string | null>(null)
  const [showReroll, setShowReroll] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [nonce, setNonce] = useState(0)
  const { data: me } = useMeQuery()
  const { copy, copied } = useClipboard()

  useEffect(() => {
    setUserKey(getUserKey())
    setStreak(readStreak())

    const daily = readDailyState(todayKey)
    if (daily) {
      setTaste(daily.taste)
      setNonce(daily.nonce)
      setRevealed(daily.revealed)
    }

    setHydrated(true)
  }, [todayKey])

  if (me === undefined) {
    return null
  }

  if (me === null) {
    return (
      <div className={LIBO_PAGE_LAYOUT.container}>
        <LoginGate />
      </div>
    )
  }

  if (!hydrated || !userKey) {
    return <LoadingState />
  }

  const fortune = revealed && taste ? generateFortune({ todayKey, userKey, taste, nonce }) : null
  const shareText = fortune ? buildShareText({ todayKey, fortune, origin: window.location.origin }) : ''
  const rerollsRemaining = MAX_REROLLS_PER_DAY - nonce

  function handleComplete(selected: FortuneTaste) {
    setTaste(selected)
    writeDailyState({ dateKey: todayKey, taste: selected, nonce, revealed: true })
    setStreak(touchStreak(todayKey))
    setRevealed(true)
  }

  function handleRerollGranted() {
    const nextNonce = Math.min(nonce + 1, MAX_REROLLS_PER_DAY)
    setNonce(nextNonce)
    writeDailyState({ dateKey: todayKey, taste, nonce: nextNonce, revealed: false })
    setRevealed(false)
    setShowReroll(false)
  }

  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <Header />
      {streak && <StreakBanner streak={streak} />}

      {!revealed || !fortune ? (
        <DrawStage initialTaste={taste} isReroll={nonce > 0} key={nonce} onComplete={handleComplete} />
      ) : (
        <>
          <HeroCard fortune={fortune} />

          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5">
            <p className="text-xs text-zinc-400">
              마음에 안 들면 다시 뽑아봐요 · 오늘 <span className="tabular-nums text-zinc-200">{rerollsRemaining}</span>
              번 남았어요
            </p>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-semibold text-zinc-100 transition hover:bg-white/12 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={rerollsRemaining <= 0}
              onClick={() => setShowReroll(true)}
              type="button"
            >
              <RotateCcw className="size-4" />
              다시 뽑기
            </button>
          </div>

          {showReroll && (
            <RerollGate
              me={me}
              onClose={() => setShowReroll(false)}
              onGranted={handleRerollGranted}
              remaining={rerollsRemaining}
            />
          )}

          <TabNav activeTab={activeTab} onChange={setActiveTab} />

          <div className={LIBO_PAGE_LAYOUT.panelReserved} role="tabpanel">
            {activeTab === 'fortune' && (
              <FortuneTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />
            )}
            {activeTab === 'course' && (
              <CourseTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />
            )}
            {activeTab === 'special' && (
              <SpecialTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
