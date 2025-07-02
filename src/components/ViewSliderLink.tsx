import Link from 'next/link'

import { ViewCookie } from '@/utils/param'

const layoutMap = {
  [ViewCookie.CARD]: { index: 0, label: '카드' },
  [ViewCookie.IMAGE]: { index: 1, label: '그림' },
}

const layouts = Object.entries(layoutMap)

type OrderToggleProps = {
  current: '' | ViewCookie
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function ViewSliderLink({ current, hrefPrefix = '', hrefSuffix = '' }: OrderToggleProps) {
  return (
    <div
      className="flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400
        [&_a]:flex [&_a]:items-center [&_a]:relative [&_a]:rounded [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground [&_a]:aria-current:pointer-events-none"
    >
      {layouts.map(([layout, { index, label }]) => (
        <Link aria-current={current === layout} href={`${hrefPrefix}${layout}${hrefSuffix}`} key={label}>
          {index === 0 && current && (
            <div
              className="absolute inset-0 bg-zinc-800 rounded-lg border-2 border-zinc-700 pointer-events-none transition"
              style={{ transform: `translateX(${100 * layoutMap[current].index}%)` }}
            />
          )}
          <span className="relative">{label}</span>
        </Link>
      ))}
    </div>
  )
}
