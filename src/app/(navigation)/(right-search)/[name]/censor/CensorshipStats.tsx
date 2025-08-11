'use client'

import { memo, useMemo } from 'react'

import { CensorshipItem } from '@/app/api/censorship/route'
import { CensorshipKey, CensorshipLevel } from '@/database/enum'

type Props = {
  censorships: CensorshipItem[]
}

export default memo(CensorshipStats)

function CensorshipStats({ censorships }: Readonly<Props>) {
  const { total, levelCount } = useMemo(() => {
    const keyCount: Record<CensorshipKey, number> = {
      [CensorshipKey.TAG]: 0,
      [CensorshipKey.ARTIST]: 0,
      [CensorshipKey.CHARACTER]: 0,
      [CensorshipKey.GROUP]: 0,
      [CensorshipKey.SERIES]: 0,
      [CensorshipKey.TAG_CATEGORY_FEMALE]: 0,
      [CensorshipKey.TAG_CATEGORY_MALE]: 0,
      [CensorshipKey.TAG_CATEGORY_MIXED]: 0,
      [CensorshipKey.TAG_CATEGORY_OTHER]: 0,
    }

    const levelCount: Record<CensorshipLevel, number> = {
      [CensorshipLevel.LIGHT]: 0,
      [CensorshipLevel.HEAVY]: 0,
      [CensorshipLevel.NONE]: 0,
    }

    censorships.forEach((censorship) => {
      keyCount[censorship.key]++
      levelCount[censorship.level]++
    })

    return { keyCount, levelCount, total: censorships.length }
  }, [censorships])

  return (
    <div className="px-3 pb-4">
      <div className="flex gap-4 text-sm text-zinc-400 overflow-x-auto">
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">{total}</span>
          <span>개 규칙</span>
        </div>
        <div className="border-l-2 border-zinc-700" />
        <div className="flex items-center gap-1">
          <span className="font-medium font-mono text-sm text-yellow-500">{levelCount[CensorshipLevel.LIGHT]}</span>
          <span>흐리게</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium font-mono text-sm text-red-500">{levelCount[CensorshipLevel.HEAVY]}</span>
          <span>숨기기</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium font-mono text-sm text-green-500">{levelCount[CensorshipLevel.NONE]}</span>
          <span>해제</span>
        </div>
      </div>
    </div>
  )
}
