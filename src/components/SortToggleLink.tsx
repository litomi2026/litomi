import { SortParam } from '@/utils/param'
import Link from 'next/link'

const sortIndexMap = {
  [SortParam.LATEST]: { index: 0, label: '최신순' },
  [SortParam.OLDEST]: { index: 1, label: '과거순' },
  [SortParam.POPULAR]: { index: 2, label: '인기순' },
}

const sorts = Object.entries(sortIndexMap)

type OrderToggleProps = {
  currentSort: '' | SortParam
  hrefPrefix?: string
  hrefSuffix?: string
  disabled?: boolean
}

export default function SortToggleLink({ disabled, currentSort, hrefPrefix = '', hrefSuffix = '' }: OrderToggleProps) {
  return (
    <div
      className="relative flex bg-zinc-900 border-2 p-1 rounded-xl text-zinc-400
        [&_a]:relative [&_a]:rounded [&_a]:flex [&_a]:items-center [&_a]:px-3 [&_a]:py-1 [&_a]:aria-current:font-bold [&_a]:aria-current:text-background [&_a]:aria-current:pointer-events-none
        [&_a]:aria-disabled:pointer-events-none [&_a]:aria-disabled:text-zinc-500 [&_a]:aria-disabled:[&>div]:bg-none [&_a]:aria-disabled:[&>div]:before:border-zinc-700"
    >
      {sorts.map(([sort, { index, label }]) => (
        <Link
          aria-current={currentSort === sort}
          aria-disabled={disabled}
          href={`${hrefPrefix}${sort}${hrefSuffix}`}
          key={label}
        >
          {index === 0 && currentSort && (
            <div
              className="absolute inset-0 bg-zinc-700 bg-brand-gradient rounded-lg pointer-events-none transition
                before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40"
              style={{ transform: `translateX(${100 * sortIndexMap[currentSort].index}%)` }}
            />
          )}
          <span className="relative">{label}</span>
        </Link>
      ))}
    </div>
  )
}
