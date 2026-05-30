import { Flame, PiggyBank, Skull } from 'lucide-react'

import type { Fortune } from '../../_lib/sexFortuneTypes'

import { SexFortuneCopyBar } from '../SexFortuneCopyBar'
import { getAccentCardStyle, SECTION_CARD_CLASS, SECTION_ITEM_CLASS } from '../sexFortuneStyles'

export function SpecialTab({
  copy,
  copied,
  fortune: _fortune,
  shareText,
}: {
  copy: (text: string) => void
  copied: boolean
  fortune: Fortune
  shareText: string
}) {
  return (
    <div className="space-y-4">
      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#ef4444')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
          >
            <Flame className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">키워서 잡아먹기</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">시골 집 단칸방에서 키워서 창녀처럼 길들여 강간할 계획이에요.</p>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <RaisingPlanItem
            label="키우기 방식"
            value="매일 정액주머니처럼 애무하며 흥분시키고, 갑자기 납치처럼 박아치기"
          />
          <RaisingPlanItem label="강간 계획" value="신선한 보짓물통으로 여러 포지션으로 미친 듯이 파헤치기" />
          <RaisingPlanItem label="흥분 극대화" value="좆물로 민감하게 만들어 하찮은 자궁으로 몰아가기" />
          <RaisingPlanItem label="섹스 문화" value="침대에 올려서 천천히 파고들며 가축년처럼 절정 맛보기" />
        </div>
      </section>

      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#a855f7')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
          >
            <Skull className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">BDSM 강간 모드</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">노예처럼 길들여서 정액쓰레기통으로 만드는 특별 모드예요.</p>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-purple-300 shrink-0">지배 방식</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              계집종을 노예처럼 밟아대며 자궁주차로 파괴하기
            </p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-purple-300 shrink-0">고통 쾌락</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              강간하면서 동시에 애무하며 암컷 본능 자극하기
            </p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-purple-300 shrink-0">절정 강제</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              보지마게 벌려서 질싸하며 임신시키고 낙태시키기
            </p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-purple-300 shrink-0">후유증</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              하찮은 자궁에 정액주머니처럼 남은 걸 보여주며 폐인 만들기
            </p>
          </div>
        </div>
      </section>

      <section className={SECTION_CARD_CLASS} style={getAccentCardStyle('#f97316')}>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-xl bg-white/6 border border-white/10 text-zinc-200"
          >
            <PiggyBank className="size-4" />
          </span>
          <p className="text-base font-semibold tracking-tight text-zinc-100">가축년 육성 계획</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400">암컷을 가축처럼 길들여서 보지마게 만드는 계획이에요.</p>

        <div className="mt-4 border-t border-white/7 pt-4 grid gap-2.5 sm:grid-cols-2">
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-orange-300 shrink-0">훈련 단계</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              매일 오나홀처럼 사용하며 순종 암컷으로 만들기
            </p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-orange-300 shrink-0">먹이 주기</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">정액주머니 채워서 정력 강화시키며 키우기</p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-orange-300 shrink-0">번식 계획</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">
              임신시켜서 낙태시키며 씨받이 본능 각인시키기
            </p>
          </div>
          <div className={SECTION_ITEM_CLASS}>
            <p className="text-xs text-orange-300 shrink-0">최종 목표</p>
            <p className="text-sm text-zinc-100 text-right leading-snug">육변기처럼 쓸 수 있는 완벽한 노예 만들기</p>
          </div>
        </div>
      </section>

      <SexFortuneCopyBar copied={copied} onCopy={() => copy(shareText)} />
    </div>
  )
}

function RaisingPlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={SECTION_ITEM_CLASS}>
      <p className="text-xs text-rose-300 shrink-0">{label}</p>
      <p className="text-sm text-zinc-100 text-right leading-snug">{value}</p>
    </div>
  )
}
