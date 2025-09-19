'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { ViewCookie } from '@/utils/param'

const layoutMap = {
  [ViewCookie.CARD]: { index: 0, label: '카드' },
  [ViewCookie.IMAGE]: { index: 1, label: '그림' },
}

const layouts = Object.entries(layoutMap)

export default function ViewSliderLink() {
  const { layout: currentLayout } = useParams()

  return (
    <div
      className="flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400
        [&_a]:flex [&_a]:items-center [&_a]:relative [&_a]:rounded [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground [&_a]:aria-current:pointer-events-none"
    >
      {layouts.map(([layout, { index, label }]) => (
        <Link aria-current={currentLayout === layout} href={layout} key={label}>
          {index === 0 && isValidLayout(currentLayout) && (
            <div
              className="absolute inset-0 bg-zinc-800 rounded-lg border-2 border-zinc-700 pointer-events-none transition"
              style={{ transform: `translateX(${100 * layoutMap[currentLayout].index}%)` }}
            />
          )}
          <span className="relative">{label}</span>
        </Link>
      ))}
    </div>
  )
}

function isValidLayout(layout: unknown): layout is keyof typeof layoutMap {
  return typeof layout === 'string' && layout in layoutMap
}
