import Link from 'next/link'
import { memo } from 'react'

import { getSearchLink } from './utils'

type Props = {
  label: string
  value?: string
  filterType: string
  className?: string
}

export default memo(MangaMetadataItem)

function MangaMetadataItem({ label, value, filterType, className = '' }: Props) {
  if (!value) return null

  return (
    <div className={`flex gap-1 ${className}`}>
      <span>{label}</span>
      <Link className="hover:underline focus:underline" href={getSearchLink(filterType, value)}>
        {value}
      </Link>
    </div>
  )
}
