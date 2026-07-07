'use client'

import { Sparkles } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { FORTUNE_INTENSITIES, FORTUNE_ROLES } from '../_lib/sexFortuneTaste'
import type { FortuneIntensity, FortuneRole, FortuneTaste } from '../_lib/sexFortuneTypes'

const DRAW_DURATION_MS = 1900

type Props = {
  initialTaste: FortuneTaste | null
  isReroll: boolean
  onComplete: (taste: FortuneTaste) => void
}

export function SexFortuneDrawStage({ initialTaste, isReroll, onComplete }: Props) {
  const [role, setRole] = useState<FortuneRole | null>(initialTaste?.role ?? null)
  const [intensity, setIntensity] = useState<FortuneIntensity | null>(initialTaste?.intensity ?? null)
  const [drawing, setDrawing] = useState(false)
  const timerRef = useRef<number | null>(null)
  const canDraw = role !== null && intensity !== null

  function handleDraw() {
    if (role === null || intensity === null || drawing) {
      return
    }

    setDrawing(true)
    timerRef.current = window.setTimeout(() => {
      onComplete({ role, intensity })
    }, DRAW_DURATION_MS)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (drawing) {
    return (
      <div className="flex-1 grid place-items-center py-16">
        <div className="relative grid place-items-center">
          <div className="absolute size-40 rounded-full bg-brand/25 blur-2xl animate-pulse" />
          <div className="relative flex size-28 items-center justify-center rounded-3xl border border-white/12 bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Sparkles className="size-10 text-brand animate-spin [animation-duration:1.6s]" />
          </div>
          <p className="mt-6 text-sm font-medium text-zinc-300">🔮 오늘의 운명을 뽑는 중…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5 space-y-5">
        <p className="text-sm font-semibold text-zinc-100">
          {isReroll ? '취향을 다시 골라봐요' : '오늘의 취향을 골라봐요'}
        </p>

        <TasteGroup label="역할">
          {FORTUNE_ROLES.map((option) => (
            <TasteChip
              desc={option.desc}
              emoji={option.emoji}
              key={option.key}
              label={option.label}
              onClick={() => setRole(option.key)}
              selected={role === option.key}
            />
          ))}
        </TasteGroup>

        <TasteGroup label="강도">
          {FORTUNE_INTENSITIES.map((option) => (
            <TasteChip
              desc={option.desc}
              emoji={option.emoji}
              key={option.key}
              label={option.label}
              onClick={() => setIntensity(option.key)}
              selected={intensity === option.key}
            />
          ))}
        </TasteGroup>
      </div>

      <button
        className="w-full rounded-2xl border border-white/10 bg-brand/90 px-4 py-3.5 text-base font-bold text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-brand active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canDraw}
        onClick={handleDraw}
        type="button"
      >
        🔮 오늘의 운세 뽑기
      </button>
    </div>
  )
}

function TasteGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-400">{label}</p>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  )
}

type TasteChipProps = {
  desc: string
  emoji: string
  label: string
  onClick: () => void
  selected: boolean
}

function TasteChip({ desc, emoji, label, onClick, selected }: TasteChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={twMerge(
        'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition',
        'border-white/8 bg-black/20 text-zinc-300 hover:bg-white/5',
        selected && 'border-brand/60 bg-brand/15 text-zinc-50 shadow-[inset_0_0_0_1px_var(--color-brand)]',
      )}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden className="text-xl leading-none">
        {emoji}
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[11px] leading-tight text-zinc-500">{desc}</span>
    </button>
  )
}
