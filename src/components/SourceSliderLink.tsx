import Link from 'next/link'

import { SourceParam } from '@/utils/param'

const sourceIndexMap: Record<string, number> = {
  [SourceParam.HIYOBI]: 0,
  [SourceParam.HARPI]: 1,
  [SourceParam.K_HENTAI]: 2,
}

const sources = Object.keys(sourceIndexMap) as SourceParam[]

type OrderToggleProps = {
  current: string
  hrefPrefixes?: (source: SourceParam) => string
  hrefSuffix?: string
}

export default function SourceSliderLink({ current, hrefPrefixes, hrefSuffix = '' }: OrderToggleProps) {
  return (
    <div
      className="flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400
        [&_a]:flex [&_a]:items-center [&_a]:relative [&_a]:rounded [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-foreground [&_a]:aria-current:pointer-events-none"
    >
      {sources.map((source, i) => (
        <Link
          aria-current={current === source}
          href={`${hrefPrefixes?.(source) ?? ''}${source}${hrefSuffix}`}
          key={source}
        >
          {i === 0 && current && (
            <div
              className="absolute inset-0 bg-zinc-800 rounded-lg border-2 border-zinc-700 transition pointer-events-none"
              style={{ transform: `translateX(${100 * sourceIndexMap[current]}%)` }}
            />
          )}
          <div className="relative min-w-5 text-center">{source}</div>
        </Link>
      ))}
    </div>
  )
}
