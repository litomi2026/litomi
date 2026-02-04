import type { Fortune } from '../_lib/sexFortuneTypes'

export function SexFortuneHeroCard({ fortune }: { fortune: Fortune }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: `
          radial-gradient(120% 120% at 18% 28%, color-mix(in oklab, var(--color-brand) 26%, transparent) 0%, transparent 56%),
          radial-gradient(100% 90% at 82% 12%, color-mix(in oklab, var(--color-brand) 18%, transparent) 0%, transparent 60%),
          radial-gradient(110% 100% at 70% 92%, color-mix(in oklab, var(--color-brand) 12%, transparent) 0%, transparent 65%),
          rgba(255, 255, 255, 0.055)
        `,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          inset 0 1px 0 rgba(255, 255, 255, 0.06),
          0 1px 0 rgba(0, 0, 0, 0.25)
        `,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-300 mb-1">오늘의 총점</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tight text-zinc-50">{fortune.overall}</p>
            <span className="text-base font-medium text-zinc-300">점</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-200">
            {fortune.keywords.map((k) => (
              <span className="rounded-full border border-zinc-600 bg-zinc-800/50 px-2.5 py-1" key={k}>
                {k}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-zinc-700 bg-zinc-950/40 p-3 text-right">
          <p className="text-xs text-zinc-400">오늘의 분위기</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-zinc-200">{fortune.vibe}</p>
          <p className="mt-2 text-xs text-zinc-400">추천 시간</p>
          <p className="mt-1 text-xs text-zinc-300">{fortune.bestTime}</p>
          <p className="mt-2 text-xs text-zinc-400">행운 컬러</p>
          <p className="mt-1 text-xs text-zinc-300">{fortune.luckyColor}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-200">{fortune.message}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <FortuneStat label="성욕" value={fortune.stats.chemistry} />
        <FortuneStat label="민감도" value={fortune.stats.stamina} />
        <FortuneStat label="회복력" value={fortune.stats.communication} />
        <FortuneStat label="창의력" value={fortune.stats.boldness} />
      </div>
    </div>
  )
}

function FortuneStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-zinc-200">{value}점</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-zinc-800">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
