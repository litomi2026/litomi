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
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
        <dt className="text-xs font-medium text-zinc-500">{t('stats.ruleCount', { count: censorships.length })}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">{censorships.length}</dd>
      </div>
      {CENSORSHIP_LEVELS.map(({ level, messagePath }) => {
        const count = levelCount[level]

        return (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2" key={level}>
            <dt className="text-xs font-medium text-zinc-500">{t(messagePath)}</dt>
            <dd className={`mt-1 text-lg font-semibold tabular-nums ${getLevelTextClassName(level)}`}>{count}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function getLevelTextClassName(level: CensorshipLevel) {
  switch (level) {
    case CensorshipLevel.HEAVY:
      return 'text-red-400'
    case CensorshipLevel.LIGHT:
      return 'text-yellow-400'
    case CensorshipLevel.NONE:
      return 'text-green-400'
  }

  return 'text-zinc-100'
}
