'use client'

import type { CensorshipItem } from '@litomi/contracts'

import { CensorshipLevel } from '@litomi/domain/censorship/model'
import { useTranslations } from 'next-intl'

import { CENSORSHIP_LEVELS } from './constants'

type Props = {
  censorships: CensorshipItem[]
}

export default function CensorshipStats({ censorships }: Props) {
  const t = useTranslations('Censorship')

  const levelCount = censorships.reduce(
    (acc, censorship) => {
      acc[censorship.level]++
      return acc
    },
    { [CensorshipLevel.LIGHT]: 0, [CensorshipLevel.HEAVY]: 0, [CensorshipLevel.NONE]: 0 },
  )

  return (
    <div className="px-3 pb-4">
      <div className="flex gap-4 text-sm text-zinc-400 overflow-x-auto">
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">{censorships.length}</span>
          <span>{t('stats.ruleCount', { count: censorships.length })}</span>
        </div>
        <div className="border-l-2 border-zinc-700" />
        {CENSORSHIP_LEVELS.map(({ level, messagePath, colorClass }) => {
          const count = levelCount[level]

          if (count === 0) {
            return null
          }

          return (
            <div className="flex items-center gap-1" key={level}>
              <span className={`font-medium font-mono text-sm ${colorClass}`}>{count}</span>
              <span>{t(messagePath)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
