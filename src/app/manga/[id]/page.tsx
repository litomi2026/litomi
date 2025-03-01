import ImageViewer from '@/components/ImageViewer'
import mangas from '@/database/manga.json'
import { BasePageProps } from '@/types/nextjs'
import { notFound } from 'next/navigation'

export default async function Page(props: BasePageProps) {
  const params = await props.params
  const { id } = params

  if (!isMangaKey(id)) {
    notFound()
  }

  const manga = mangas[id]

  return (
    <div className="relative mx-auto max-w-screen-2xl">
      <ImageViewer manga={manga} />
    </div>
  )
}

function isMangaKey(key: string): key is keyof typeof mangas {
  return key in mangas
}
