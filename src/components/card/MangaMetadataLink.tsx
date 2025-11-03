'use client'

import Link from 'next/link'

import { useSearchFilter } from '@/components/card/useSearchFilter'

import MangaMetadataLabel from './MangaMetadataLabel'

type Props = {
  value: string
  label?: string
  filterType: string
  i?: number
}

export default function MangaMetadataLink({ value, label, filterType, i = 0 }: Props) {
  const { href, isActive } = useSearchFilter(`${filterType}:${value}`)

  return (
    <>
      {i > 0 && <span className="pr-1">,</span>}
      <Link
        aria-current={isActive}
        className="hover:underline focus:underline aria-current:text-brand aria-current:font-semibold"
        href={href}
        prefetch={false}
      >
        <MangaMetadataLabel>{label || value}</MangaMetadataLabel>
      </Link>
    </>
  )
}
