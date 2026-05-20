import Link from 'next/link'

import { getSearchFilter } from './searchFilter'

type Props = {
  filterType: string
  i?: number
  label?: string
  searchParams?: string
  value: string
}

export default function MangaMetadataLink({ filterType, i = 0, label, searchParams, value }: Props) {
  const { href, isActive } = getSearchFilter(`${filterType}:${value}`, searchParams)

  return (
    <>
      {i > 0 && <span className="pr-1">,</span>}
      <Link
        aria-current={isActive}
        className="hover:underline focus:underline aria-current:text-brand aria-current:font-semibold"
        href={href}
        prefetch={false}
      >
        {label || value}
      </Link>
    </>
  )
}
