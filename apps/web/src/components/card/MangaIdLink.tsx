import { ExternalLink } from 'lucide-react'

import { isSearchFilterActive } from './searchFilter'

type Props = {
  id: number
  searchParams?: URLSearchParams
  viewerLink: string
}

export default function MangaIdLink({ id, searchParams, viewerLink }: Props) {
  const isActive = isSearchFilterActive(`id:${id}`, searchParams)

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
