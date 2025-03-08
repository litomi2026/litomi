import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { isMangaKey } from '@/database/manga'
import mangas from '@/database/manga.json'
import { BasePageProps } from '@/types/nextjs'
import { notFound } from 'next/navigation'

export default async function Page({ params }: BasePageProps) {
  const { id } = await params

  if (!isMangaKey(id)) {
    notFound()
  }

  const manga = mangas[id]

  return (
    <main>
      <ImageViewer manga={manga} />
    </main>
  )
}
