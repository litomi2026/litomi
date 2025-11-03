'use client'

import { ExternalLink } from 'lucide-react'
import { memo } from 'react'

import { useSearchFilter } from '@/components/card/useSearchFilter'

type Props = {
  id: number
  viewerLink: string
}

export default memo(MangaIdLink)

function MangaIdLink({ id, viewerLink }: Props) {
  const { isActive } = useSearchFilter(`id:${id}`)

  return (
    <a
      aria-current={isActive}
      className="flex items-center gap-1 text-zinc-400 hover:underline focus:underline aria-current:text-brand aria-current:font-semibold"
      href={viewerLink}
      target="_blank"
    >
      {id}
      <ExternalLink className="size-3" />
    </a>
  )
}
