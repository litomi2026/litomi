import Link from 'next/link'
import { memo } from 'react'

import { getSearchLink } from './utils'

type Props = {
  label: string
  items?: string[]
  filterType: string
  className?: string
}

export default memo(MangaMetadataList)

function MangaMetadataList({ label, items, filterType, className = '' }: Props) {
  if (!items || items.length === 0) return null

  return (
    <div className={`flex gap-1 ${className}`}>
      <span className="whitespace-nowrap">{label}</span>
      <div className="break-all">
        {items.map((item, idx) => (
          <Link
            className="px-0.5 first:pl-0 last:pr-0 hover:underline focus:underline"
            href={getSearchLink(filterType, item)}
            key={item}
          >
            {item.replaceAll('_', ' ')}
            {idx < items.length - 1 && ','}
          </Link>
        ))}
      </div>
    </div>
  )
}
