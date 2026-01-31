'use client'

import { useEffect, useState } from 'react'

import useClipboard from '@/hook/useClipboard'
import useMeQuery from '@/query/useMeQuery'

import type { SexFortuneTab } from './_lib/sexFortuneTypes'

import { SexFortuneHeader } from './_components/SexFortuneHeader'
import { SexFortuneHeroCard } from './_components/SexFortuneHeroCard'
import { SexFortuneLoadingState } from './_components/SexFortuneLoadingState'
import { SexFortuneLoginGate } from './_components/SexFortuneLoginGate'
import { LIBO_PAGE_LAYOUT } from './_components/sexFortuneStyles'
import { SexFortuneTabNav } from './_components/SexFortuneTabNav'
import { CourseTab } from './_components/tabs/CourseTab'
import { FortuneTab } from './_components/tabs/FortuneTab'
import { SpecialTab } from './_components/tabs/SpecialTab'
import { createClientSeed, generateFortune } from './_lib/sexFortuneGenerator'
import { buildSexFortuneShareText } from './_lib/sexFortuneShareText'

type Props = {
  todayKey: string
}

const STORAGE_KEY = 'litomi.sexFortune.userId'

export default function SexFortune({ todayKey }: Readonly<Props>) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const { copy, copied } = useClipboard()
  const [userKey, setUserKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SexFortuneTab>('fortune')

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      setUserKey(existing)
      return
    }

    const newKey = createClientSeed()
    window.localStorage.setItem(STORAGE_KEY, newKey)
    setUserKey(newKey)
  }, [])

  if (isMeLoading) {
    return <SexFortuneLoadingState />
  }

  if (!me) {
    return <SexFortuneLoginGate />
  }

  if (!userKey) {
    return <SexFortuneLoadingState />
  }

  const fortune = generateFortune({ todayKey, userKey })

  const shareText = buildSexFortuneShareText({ todayKey, fortune, origin: window.location.origin })

  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <SexFortuneHeader />
      <SexFortuneHeroCard fortune={fortune} />
      <SexFortuneTabNav activeTab={activeTab} onChange={setActiveTab} />

      <div className={LIBO_PAGE_LAYOUT.panelReserved} role="tabpanel">
        {activeTab === 'fortune' && <FortuneTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />}
        {activeTab === 'course' && <CourseTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />}
        {activeTab === 'special' && <SpecialTab copied={copied} copy={copy} fortune={fortune} shareText={shareText} />}
      </div>
    </div>
  )
}
