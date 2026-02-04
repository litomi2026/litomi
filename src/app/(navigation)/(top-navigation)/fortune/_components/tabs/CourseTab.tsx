import { Car, Heart, Home } from 'lucide-react'

import type { Fortune } from '../../_lib/sexFortuneTypes'

import { SexFortuneCopyBar } from '../SexFortuneCopyBar'
import { getAccentCardStyle, SECTION_CARD_CLASS, SECTION_ITEM_CLASS } from '../sexFortuneStyles'

export function CourseTab({
  copy,
  copied,
  fortune,
  shareText,
}: {
  copy: (text: string) => void
  copied: boolean
  fortune: Fortune
  shareText: string
}) {
  return (
    <div className="space-y-4">
      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#60a5fa')}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
              >
                <Heart className="size-4" />
              </span>
              <p className="text-base font-semibold tracking-tight text-zinc-100">오늘의 추천 코스</p>
            </div>
            <p className="mt-2 text-xs text-zinc-400">욕망을 확인하며, 격정적으로 탐험해요.</p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <CourseItem label="체위" value={fortune.course.position} />
          <CourseItem label="장소" value={fortune.course.place} />
          <CourseItem label="정력 음식" value={fortune.course.staminaFood} />
          <CourseItem label="코스튬" value={fortune.course.costume} />
          <CourseItem label="시나리오" value={fortune.course.scenario} />
          <CourseItem label="애프터케어" value={fortune.course.aftercare} />
        </div>
      </section>

      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#ec4899')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
          >
            <Car className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">납치 데이트 계획</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">상대방을 납치하듯 차에 태워서 강제로 데려갈 데이트 계획이에요.</p>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <DatePlanItem label="언제 납치" value="오늘 저녁 8시나 내일 오후에 차로 가축년을 납치해 봐" />
          <DatePlanItem label="어디로 데려가" value="카페 → 산책 → 저녁 식사 코스로 보지마게 하듯 끌고 다니기" />
          <DatePlanItem label="데이트 중 할 일" value="손 잡고 이야기 나누며 계집종처럼 길들이기" />
          <DatePlanItem label="데이트 후 계획" value="집 앞까지 데려다주고 다음 질싸 약속하기" />
        </div>
      </section>

      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#22c55e')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
          >
            <Home className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">미래 계획</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">납치 후 차와 시골집을 어떻게 마련해서 강간할지 계획이에요.</p>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <FuturePlanItem
            label="차 마련 계획"
            value="3년 저축해서 중형 세단 구입, 매달 50만원씩 적금해서 보지마게용으로 쓰기"
          />
          <FuturePlanItem label="시골집 계획" value="시골 단칸방부터 시작해서 점점 확장, 정액주머니 키우며 살기" />
          <FuturePlanItem label="결혼 자금" value="각자 3천만원씩 모아서 총 6천만원으로 개보지 사기" />
          <FuturePlanItem label="생활 계획" value="도시 근처 시골집에서 출퇴근하며 젖탱이 흔들리게 길들이기" />
        </div>
      </section>

      <SexFortuneCopyBar copied={copied} onCopy={() => copy(shareText)} />
    </div>
  )
}

function CourseItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SECTION_ITEM_CLASS}>
      <p className="text-xs text-zinc-400 shrink-0">{label}</p>
      <p className="text-sm text-zinc-100 text-right leading-snug">{value}</p>
    </div>
  )
}

function DatePlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SECTION_ITEM_CLASS}>
      <p className="text-xs text-pink-300 shrink-0">{label}</p>
      <p className="text-sm text-zinc-100 text-right leading-snug">{value}</p>
    </div>
  )
}

function FuturePlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SECTION_ITEM_CLASS}>
      <p className="text-xs text-emerald-300 shrink-0">{label}</p>
      <p className="text-sm text-zinc-100 text-right leading-snug">{value}</p>
    </div>
  )
}
