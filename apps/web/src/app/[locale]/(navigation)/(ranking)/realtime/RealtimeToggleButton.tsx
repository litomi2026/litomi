'use client'

import { useTranslations } from 'next-intl'

import { useRealtimeStore } from './store'

export default function RealtimeToggleButton() {
  const { isLive, setIsLive } = useRealtimeStore()
  const t = useTranslations('RealtimeRanking')

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${isLive ? 'animate-pulse bg-green-500' : 'bg-zinc-500'}`} />
        <span className="text-sm text-zinc-400">{isLive ? t('liveStatus') : t('pausedStatus')}</span>
      </div>
      <button
        className="rounded-lg bg-zinc-800 px-4 p-2 text-sm transition hover:bg-zinc-700"
        onClick={() => setIsLive(!isLive)}
      >
        {isLive ? t('pause') : t('resume')}
      </button>
    </div>
  )
}
