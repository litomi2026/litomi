import MangaCard from '@/components/card/MangaCard'
import { CANONICAL_URL } from '@/constants/url'
import { mangaIds, mangas } from '@/database/manga'
import { Metadata } from 'next'

import ShuffleButton from '../../../../components/ShuffleButton'

export const revalidate = 60

export const metadata: Metadata = {
  alternates: {
    canonical: `${CANONICAL_URL}/mangas/random`,
    languages: { ko: `${CANONICAL_URL}/mangas/random` },
  },
}

export default async function Page() {
  const currentMangaIds = mangaIds.sort(() => Math.random() - 0.5).slice(0, 20)

  return (
    <main className="grid gap-2">
      <div className="flex justify-end items-center">
        <ShuffleButton
          action="refresh"
          className="flex gap-2 items-center w-fit border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900"
          iconClassName="w-5"
        />
      </div>
      <ul className="grid md:grid-cols-2 gap-2">
        {currentMangaIds.map((id, i) => (
          <MangaCard index={i} key={id} manga={mangas[id]} />
        ))}
      </ul>
      <div className="flex justify-center items-center">
        <ShuffleButton
          action="refresh"
          className="flex gap-2 items-center w-fit border-2 px-3 py-2 rounded-xl transition border-zinc-800 hover:bg-zinc-800 active:bg-zinc-900"
          iconClassName="w-5"
        />
      </div>
    </main>
  )
}
