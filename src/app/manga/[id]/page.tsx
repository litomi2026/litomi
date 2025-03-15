import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { isMangaKey, mangas } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import { getImageSrc } from '@/utils/manga'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

type MangaForMetadata = {
  title: string
  images: { name: string }[]
  cdn?: string
}

export async function generateMetadata({ params }: BasePageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params

  if (!isMangaKey(id)) {
    return parent as Metadata
  }

  const { title, images, cdn } = mangas[id] as MangaForMetadata

  return {
    title: `${title} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      images: images.slice(0, 3).map(({ name }) => getImageSrc({ path: name, cdn, id: +id })),
    },
  }
}

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
