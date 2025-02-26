import { BasePageProps } from '@/common/type'
import ImageViewer from '@/components/ImageViewer'
import mangas from '@/database/manga.json'
import { notFound } from 'next/navigation'

function isMangaKey(key: string): key is keyof typeof mangas {
  return key in mangas
}

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
