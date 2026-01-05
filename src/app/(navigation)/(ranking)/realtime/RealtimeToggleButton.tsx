'use client'

import { useRealtimeStore } from './store'

export default function RealtimeToggleButton() {
  const { isLive, setIsLive } = useRealtimeStore()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`size-2 rounded-full ${isLive ? 'animate-pulse bg-green-500' : 'bg-zinc-500'}`} />
        <span className="text-sm text-zinc-400">{isLive ? '실시간 업데이트 중' : '일시 정지됨'}</span>
      </div>
      <button
        className="rounded-lg bg-zinc-800 px-4 p-2 text-sm transition hover:bg-zinc-700"
        onClick={() => setIsLive(!isLive)}
      >
        {isLive ? '일시 정지' : '재개'}
      </button>
    </div>
  )
}
