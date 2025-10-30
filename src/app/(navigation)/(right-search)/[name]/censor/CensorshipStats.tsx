'use client'

import { memo, useMemo } from 'react'

import { CensorshipItem } from '@/backend/api/v1/censorship'
import { CensorshipLevel } from '@/database/enum'

type Props = {
  censorships: CensorshipItem[]
}

export default memo(CensorshipStats)

function CensorshipStats({ censorships }: Readonly<Props>) {
  const levelCount = useMemo(() => {
    return censorships.reduce(
      (acc, censorship) => {
        acc[censorship.level]++
        return acc
      },
      { [CensorshipLevel.LIGHT]: 0, [CensorshipLevel.HEAVY]: 0, [CensorshipLevel.NONE]: 0 },
    )
  }, [censorships])

  const lightCount = levelCount[CensorshipLevel.LIGHT]
  const heavyCount = levelCount[CensorshipLevel.HEAVY]
  const noneCount = levelCount[CensorshipLevel.NONE]

  return (
    <div className="px-3 pb-4">
      <div className="flex gap-4 text-sm text-zinc-400 overflow-x-auto">
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">{censorships.length}</span>
          <span>개 규칙</span>
        </div>
        <div className="border-l-2 border-zinc-700" />
        {lightCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium font-mono text-sm text-yellow-500">{lightCount}</span>
            <span>흐리게</span>
          </div>
        )}
        {heavyCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium font-mono text-sm text-red-500">{heavyCount}</span>
            <span>숨기기</span>
          </div>
        )}
        {noneCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="font-medium font-mono text-sm text-green-500">{noneCount}</span>
            <span>해제</span>
          </div>
        )}
      </div>
    </div>
  )
}
