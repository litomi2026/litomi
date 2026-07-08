'use client'

import { LIBO_PAGE_LAYOUT } from './styles'

export function LoadingState({ message }: { message?: string }) {
  return (
    <div className={LIBO_PAGE_LAYOUT.container}>
      <div className="flex-1 grid place-items-center py-10 text-sm text-zinc-400">
        {message ?? '🔥 오늘의 뜨거운 섹스 운세를 계산하고 있어요…'}
      </div>
    </div>
  )
}
