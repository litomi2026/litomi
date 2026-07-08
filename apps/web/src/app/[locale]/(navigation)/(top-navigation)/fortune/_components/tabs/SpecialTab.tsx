import { Lock, Skull } from 'lucide-react'

import { getRarityMetaByKey } from '../../_lib/rarity'
import type { Fortune } from '../../_lib/types'

import { CopyBar } from '../CopyBar'
import { getAccentCardStyle, SECTION_CARD_CLASS, SECTION_ITEM_CLASS } from '../styles'

const MAX_SPECIAL_COUNT = getRarityMetaByKey('SSR').specialCount

type Props = {
  copy: (text: string) => void
  copied: boolean
  fortune: Fortune
  shareText: string
}

export function SpecialTab({ copy, copied, fortune, shareText }: Props) {
  const rarity = getRarityMetaByKey(fortune.rarity)
  const lockedCount = Math.max(0, MAX_SPECIAL_COUNT - fortune.special.length)

  return (
    <div className="space-y-4">
      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle(rarity.accent)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-zinc-200"
            >
              <Skull className="size-4" />
            </span>
            <p className="text-base font-semibold tracking-tight text-zinc-100">특별 시나리오</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              color: rarity.accent,
              background: `color-mix(in oklab, ${rarity.accent} 16%, transparent)`,
              border: `1px solid color-mix(in oklab, ${rarity.accent} 45%, transparent)`,
            }}
          >
            {fortune.special.length}/{MAX_SPECIAL_COUNT} 개방
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {rarity.key === 'SSR'
            ? '전설 등급! 특별 시나리오가 모두 열렸어요.'
            : '더 높은 등급을 뽑을수록 더 많은 특별 시나리오가 열려요.'}
        </p>

        <ol className="mt-4 space-y-2.5 border-t border-white/7 pt-4">
          {fortune.special.map((scenario, index) => (
            <li className={SECTION_ITEM_CLASS} key={scenario}>
              <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: rarity.accent }}>
                {index + 1}
              </span>
              <p className="text-right text-sm leading-snug text-zinc-100">{scenario}</p>
            </li>
          ))}

          {Array.from({ length: lockedCount }, (_, index) => (
            <li
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-3 text-xs text-zinc-500"
              key={`locked-${index}`}
            >
              <Lock className="size-3.5" />더 높은 등급에서 열려요
            </li>
          ))}
        </ol>
      </section>

      <CopyBar copied={copied} onCopy={() => copy(shareText)} />
    </div>
  )
}
