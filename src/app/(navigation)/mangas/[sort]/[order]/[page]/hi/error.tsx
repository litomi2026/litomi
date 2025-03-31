'use client'
import MangaCard from '@/components/card/MangaCard'
import OrderToggleLink from '@/components/OrderToggleLink'
import ShuffleButton from '@/components/ShuffleButton'
import { mangaIds, mangas } from '@/database/manga'

// Error components must be Client Components

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  return (
    <main className="grid gap-2">
      <div className="flex justify-end gap-2">
        <ShuffleButton action="random" className="w-fit " iconClassName="w-5" />
      </div>

      <button className="">다시 시도하기</button>
    </main>
  )
}
