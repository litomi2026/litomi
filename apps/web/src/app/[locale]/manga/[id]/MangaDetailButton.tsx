'use client'

import type { Manga } from '@litomi/domain/manga/model'
import type { ComponentProps } from 'react'

import { useMangaDetailModal } from '@/components/MangaDetailModal'

interface Props extends ComponentProps<'button'> {
  manga: Manga
}

export default function MangaDetailButton({ manga, ...props }: Props) {
  const { title } = manga
  const { open } = useMangaDetailModal()

  return (
    <button {...props} onClick={() => open({ manga })} type="button">
      <h1 className="flex-1 text-center line-clamp-1 font-bold text-foreground break-all md:text-lg">{title}</h1>
    </button>
  )
}
