'use client'

import { RefObject, useEffect, useMemo, useRef, useState } from 'react'

import { getRouletteRoiInfo, ROULETTE_CONFIG, type RouletteSegment } from '@/constants/roulette'
import useMeQuery from '@/query/useMeQuery'
import { formatNumber } from '@/utils/format/number'

import { useRouletteSpinMutation } from './useRouletteSpinMutation'

type SpinPhase = 'idle' | 'loop' | 'settle'

type WheelSlice = {
  id: RouletteSegment['id']
  index: number
  startAngleDeg: number
  midAngleDeg: number
}

export default function RoulettePageClient() {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const isLoggedIn = Boolean(me && !isMeLoading)

  const [bet, setBet] = useState<number>(ROULETTE_CONFIG.minBet)
  const spin = useRouletteSpinMutation()
  const [rotationDeg, setRotationDeg] = useState(0)
  const [phase, setPhase] = useState<SpinPhase>('idle')
  const [isResultRevealed, setIsResultRevealed] = useState(false)
  const loopTimerRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)

  const _roi = getRouletteRoiInfo(ROULETTE_CONFIG)
  const result = spin.data

  const wheelSlices = useMemo(() => {
    return buildWheelSlices(ROULETTE_CONFIG.segments, 36)
  }, [])

  const wheelBackground = useMemo(() => {
    return buildRouletteConicGradient(wheelSlices)
  }, [wheelSlices])

  useEffect(() => {
    return () => {
      stopSpinLoop(loopTimerRef)
      stopTimer(revealTimerRef)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/4 border border-white/7 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-zinc-200 font-medium">리보 룰렛</p>
          </div>
        </div>

        <details className="group mt-3 rounded-xl bg-white/3 border border-white/7 px-3 py-2">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
            <span className="text-sm text-zinc-300">배당표 보기</span>
            <span className="text-xs text-zinc-500 group-open:hidden">열기</span>
            <span className="text-xs text-zinc-500 hidden group-open:inline">닫기</span>
          </summary>
          <div className="mt-2 space-y-2">
            {ROULETTE_CONFIG.segments.map((s) => (
              <div className="flex items-center justify-between gap-3 text-sm" key={s.id}>
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden className="inline-flex items-center gap-1">
                    <span
                      className="size-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: getSliceColor(s.id, 0) }}
                    />
                    <span
                      className="size-3 rounded-sm border border-white/20"
                      style={{ backgroundColor: getSliceColor(s.id, 1) }}
                    />
                  </span>
                  <span className="text-zinc-300 truncate">{s.label}</span>
                </div>
                <span className="tabular-nums text-zinc-400">{formatMultiplier(s.payoutMultiplierX100)}</span>
              </div>
            ))}
            <p className="text-xs text-zinc-500">
              배수는 “배팅 포함 지급” 기준이에요. 예를 들어 2배면 배팅 후에 배팅액의 2배가 지급돼요
            </p>
          </div>
        </details>
      </div>

      {/* 룰렛 휠 */}
      <div className="rounded-2xl bg-white/4 border border-white/7 p-4">
        <div className="flex items-center justify-center">
          <div className="relative w-[min(360px,100%)] aspect-square">
            {/* Pointer */}
            <div className="absolute left-1/2 top-[-6px] z-20 -translate-x-1/2">
              <div className="h-0 w-0 border-l-10 border-l-transparent border-r-10 border-r-transparent border-t-18 border-t-white/85 drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]" />
            </div>

            <div
              className="absolute inset-0 rounded-full border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              style={{
                background: wheelBackground,
                transform: `rotate(${rotationDeg}deg)`,
                transition:
                  phase === 'loop'
                    ? 'transform 250ms linear'
                    : phase === 'settle'
                      ? 'transform 2600ms cubic-bezier(0.12, 0.9, 0.18, 1)'
                      : 'transform 400ms ease-out',
              }}
            >
              {/* Slice separators (overlay) */}
              <div className="absolute inset-[10px] rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,255,255,0.12)_0deg,rgba(255,255,255,0.12)_0.9deg,transparent_0.9deg,transparent_10deg)] opacity-70" />

              {/* Gloss + vignette */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.20),transparent_35%),radial-gradient(circle_at_50%_60%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

              {/* Center cap */}
              <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 border border-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 border border-white/15" />
            </div>

            {/* Center text (doesn't rotate) */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-xs text-white/60">배팅</p>
              <p className="text-lg font-semibold tabular-nums text-white/90 drop-shadow-[0_8px_18px_rgba(0,0,0,0.7)]">
                {formatNumber(bet)} <span className="text-sm font-medium text-white/70">리보</span>
              </p>
              {phase !== 'idle' ? (
                <p className="mt-1 text-xs text-white/70">{phase === 'loop' ? '돌리는 중…' : '멈추는 중…'}</p>
              ) : (
                <p className="mt-1 text-xs text-white/55">아래 버튼으로 돌릴 수 있어요</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">
          {phase === 'loop' && <p className="text-sm text-zinc-400">돌리는 중…</p>}
          {phase === 'settle' && <p className="text-sm text-zinc-400">멈추는 중…</p>}
          {phase === 'idle' && <p className="text-sm text-zinc-500">배팅하고 돌려보세요</p>}
        </div>
      </div>

      <div className="rounded-2xl bg-white/4 border border-white/7 p-4 space-y-3">
        {!isLoggedIn ? (
          <div className="text-center py-6">
            <p className="text-zinc-300 font-medium">로그인하면 룰렛에 참여할 수 있어요</p>
            <p className="text-sm text-zinc-500 mt-1">먼저 리보를 적립한 뒤에 배팅해 보세요</p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              stopTimer(revealTimerRef)
              setIsResultRevealed(false)
              setPhase('loop')
              startSpinLoop(loopTimerRef, setRotationDeg)

              spin.mutate(
                { bet },
                {
                  onSuccess: (data) => {
                    stopSpinLoop(loopTimerRef)

                    setPhase('settle')
                    const desiredRotationWithin360 = getDesiredRotationWithin360({
                      landedId: data.landed.id,
                      slices: wheelSlices,
                    })

                    setRotationDeg((current) => {
                      const normalized = mod360(current)
                      const delta = mod360(desiredRotationWithin360 - normalized)
                      return current + 360 * 3 + delta
                    })

                    revealTimerRef.current = window.setTimeout(() => {
                      setIsResultRevealed(true)
                      setPhase('idle')
                    }, 2600)
                  },
                  onError: () => {
                    stopSpinLoop(loopTimerRef)
                    setPhase('idle')
                  },
                },
              )
            }}
          >
            <div className="space-y-2">
              <label className="text-sm text-zinc-300" htmlFor="bet">
                배팅 리보
              </label>
              <input
                className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-zinc-100 outline-none focus:border-white/20"
                disabled={phase !== 'idle'}
                id="bet"
                inputMode="numeric"
                max={ROULETTE_CONFIG.maxBet}
                min={ROULETTE_CONFIG.minBet}
                name="bet"
                onChange={(e) => setBet(Number(e.target.value))}
                required
                step={10}
                type="number"
                value={bet}
              />
              <p className="text-xs text-zinc-500">
                최소 {formatNumber(ROULETTE_CONFIG.minBet)} 리보 · 최대 {formatNumber(ROULETTE_CONFIG.maxBet)} 리보
              </p>
            </div>

            <button
              aria-disabled={spin.isPending || phase !== 'idle'}
              className="w-full py-2.5 rounded-xl bg-white/8 border border-white/10 text-zinc-100 hover:bg-white/10 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed transition font-medium"
              disabled={spin.isPending || phase !== 'idle'}
              type="submit"
            >
              {spin.isPending ? '돌리는 중…' : '룰렛 돌리기'}
            </button>

            {spin.isError && (
              <div className="rounded-xl bg-white/3 border border-white/10 px-3 py-2">
                <p className="text-sm text-zinc-300">{spin.error.problem.detail ?? '룰렛에 실패했어요'}</p>
              </div>
            )}
          </form>
        )}
      </div>

      {result && isResultRevealed && (
        <div className="rounded-2xl bg-white/4 border border-white/7 p-4">
          <p className="text-zinc-200 font-medium">결과</p>
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-zinc-300">
              <span className="text-zinc-500">도착</span> {result.landed.label} (
              {formatMultiplier(result.landed.payoutMultiplierX100)})
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">배팅</span> -{formatNumber(result.bet)} 리보
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">지급</span> +{formatNumber(result.payout)} 리보
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">손익</span>{' '}
              <span className={result.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {result.net >= 0 ? '+' : ''}
                {formatNumber(result.net)} 리보
              </span>
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">새 잔액</span> {formatNumber(result.balance)} 리보
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function buildRouletteConicGradient(slices: WheelSlice[]): string {
  const n = slices.length
  const stops = slices.map((s) => {
    const start = (s.index / n) * 100
    const end = ((s.index + 1) / n) * 100
    return `${getSliceColor(s.id, s.index)} ${start}% ${end}%`
  })

  // Conic gradients start from the top by default (0deg). Keep math aligned with slice angles.
  return `conic-gradient(from 0deg, ${stops.join(', ')})`
}

function buildWheelSlices(segments: RouletteSegment[], sliceCount: number): WheelSlice[] {
  const totalWeight = segments.reduce((acc, s) => acc + s.weight, 0)
  const desired = segments.map((s) => {
    const exact = (sliceCount * s.weight) / totalWeight
    const base = Math.floor(exact)
    return { id: s.id, remainder: exact - base, count: base }
  })

  // Ensure each segment appears at least once for a “busy” wheel look.
  for (const d of desired) {
    if (d.count === 0) {
      d.count = 1
      d.remainder = 0
    }
  }

  let used = desired.reduce((acc, d) => acc + d.count, 0)
  if (used > sliceCount) {
    desired.sort((a, b) => b.count - a.count)
    while (used > sliceCount) {
      const target = desired.find((d) => d.count > 1)
      if (!target) break
      target.count -= 1
      used -= 1
    }
  } else if (used < sliceCount) {
    desired.sort((a, b) => b.remainder - a.remainder)
    while (used < sliceCount) {
      const target = desired[(used - desired.length) % desired.length]
      if (!target) break
      target.count += 1
      used += 1
    }
  }

  const remaining = desired.map((d) => ({ id: d.id, remaining: d.count }))
  const ids: RouletteSegment['id'][] = []
  for (let i = 0; i < sliceCount; i++) {
    remaining.sort((a, b) => b.remaining - a.remaining)
    const prev = ids[ids.length - 1]
    const pick =
      remaining.find((r) => r.remaining > 0 && r.id !== prev) ?? remaining.find((r) => r.remaining > 0) ?? remaining[0]
    if (!pick) break
    ids.push(pick.id)
    pick.remaining -= 1
  }

  const anglePer = 360 / sliceCount
  return ids.map((id, index) => ({
    id,
    index,
    startAngleDeg: index * anglePer,
    midAngleDeg: index * anglePer + anglePer / 2,
  }))
}

function formatMultiplier(payoutMultiplierX100: number): string {
  if (payoutMultiplierX100 % 100 === 0) {
    return `${payoutMultiplierX100 / 100}배`
  }
  return `${(payoutMultiplierX100 / 100).toFixed(2)}배`
}

function getDesiredRotationWithin360({
  landedId,
  slices,
}: {
  landedId: RouletteSegment['id']
  slices: WheelSlice[]
}): number {
  const candidates = slices.filter((s) => s.id === landedId)
  const slice = candidates.length ? candidates[Math.floor(random01() * candidates.length)] : slices[0]
  if (!slice) return 0
  return mod360(360 - slice.midAngleDeg)
}

function getSegmentColor(id: RouletteSegment['id']): string {
  if (id === 'jackpot') return '#FBBF24' // amber-400
  if (id === 'double') return '#34D399' // emerald-400
  if (id === 'boost') return '#60A5FA' // blue-400
  return '#3F3F46' // zinc-700
}

function getSliceColor(id: RouletteSegment['id'], index: number): string {
  // Alternate a bit to make the wheel feel “busier”.
  if (id === 'lose') return index % 2 === 0 ? '#3F3F46' : '#2A2A33'
  if (id === 'jackpot') return index % 2 === 0 ? '#FBBF24' : '#F59E0B'
  if (id === 'double') return index % 2 === 0 ? '#34D399' : '#10B981'
  if (id === 'boost') return index % 2 === 0 ? '#60A5FA' : '#3B82F6'
  return getSegmentColor(id)
}

function mod360(deg: number): number {
  return ((deg % 360) + 360) % 360
}

function random01(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]! / 0xffff_ffff
}

function startSpinLoop(timerRef: RefObject<number | null>, setRotation: (updater: (v: number) => number) => void) {
  stopSpinLoop(timerRef)
  timerRef.current = window.setInterval(() => {
    setRotation((v) => v + 480)
  }, 250)
}

function stopSpinLoop(timerRef: RefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearInterval(timerRef.current)
    timerRef.current = null
  }
}

function stopTimer(timerRef: RefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }
}
