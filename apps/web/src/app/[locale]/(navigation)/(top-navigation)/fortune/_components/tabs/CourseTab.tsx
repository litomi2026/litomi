import { Heart, Target } from 'lucide-react'

import type { Fortune } from '../../_lib/sexFortuneTypes'

import { SexFortuneCopyBar } from '../SexFortuneCopyBar'
import { getAccentCardStyle, SECTION_CARD_CLASS, SECTION_ITEM_CLASS } from '../sexFortuneStyles'

type Props = {
  copy: (text: string) => void
  copied: boolean
  fortune: Fortune
  shareText: string
}

export function CourseTab({ copy, copied, fortune, shareText }: Props) {
  return (
    <div className="space-y-4">
      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#60a5fa')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-zinc-200"
          >
            <Heart className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">오늘의 추천 코스</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">욕망을 확인하며, 격정적으로 탐험해요.</p>

        <div className="mt-4 grid gap-2.5 border-t border-white/7 pt-4 sm:grid-cols-2">
          <CourseItem label="자세" value={fortune.course.position} />
          <CourseItem label="장소" value={fortune.course.place} />
          <CourseItem label="음식" value={fortune.course.staminaFood} />
          <CourseItem label="의상" value={fortune.course.costume} />
          <CourseItem label="상황" value={fortune.course.scenario} />
          <CourseItem label="마무리" value={fortune.course.aftercare} />
        </div>
      </section>

      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#ec4899')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/6 text-zinc-200"
          >
            <Target className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">오늘의 미션</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">하나씩 클리어하며 오늘의 취향을 완성해봐요.</p>

        <ol className="mt-4 space-y-2.5 border-t border-white/7 pt-4">
          {fortune.missions.map((mission, index) => (
            <li className={SECTION_ITEM_CLASS} key={mission}>
              <span className="shrink-0 text-xs font-bold text-pink-300 tabular-nums">{index + 1}</span>
              <p className="text-right text-sm leading-snug text-zinc-100">{mission}</p>
            </li>
          ))}
        </ol>
      </section>

      <SexFortuneCopyBar copied={copied} onCopy={() => copy(shareText)} />
    </div>
  )
}

function CourseItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SECTION_ITEM_CLASS}>
      <p className="shrink-0 text-xs text-zinc-400">{label}</p>
      <p className="text-right text-sm leading-snug text-zinc-100">{value}</p>
    </div>
  )
}
