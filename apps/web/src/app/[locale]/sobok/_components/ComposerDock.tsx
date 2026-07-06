import type { ReactNode } from 'react'

export default function ComposerDock({ preview, children }: { preview?: ReactNode; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pt-2 pb-[max(var(--safe-area-bottom),0.75rem)]">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-foreground/15 bg-zinc-900/90 backdrop-blur focus-within:ring-2 focus-within:ring-indigo-500/30">
        {preview && <div className="border-b border-foreground/15">{preview}</div>}
        {children}
      </div>
    </div>
  )
}
