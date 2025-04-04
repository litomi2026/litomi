import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { CANONICAL_URL } from '@/constants/url'
import { hashaMangaIdsByPage, hashaMangas } from '@/database/hasha'
import { BasePageProps } from '@/types/nextjs'
import { getImageSrc } from '@/utils/manga'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'

export async function generateMetadata({ params }: BasePageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params
  const manga = hashaMangas[id]

  if (!manga) {
    return parent as Metadata
  }

  const { title, images, cdn } = manga

  return {
    alternates: {
      canonical: `${CANONICAL_URL}/manga`,
      languages: { ko: `${CANONICAL_URL}/manga` },
    },
    title: `${title} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      images: images.slice(0, 3).map((path) => getImageSrc({ path, cdn, id: +id })),
    },
  }
}

export async function generateStaticParams() {
  const firstPageMangaIds = hashaMangaIdsByPage.id.desc.slice(0, 2).flat()
  return firstPageMangaIds.map((id) => ({ id }))
}

export default async function Page({ params }: BasePageProps) {
  const { id } = await params
  const manga = hashaMangas[id]

  if (!manga) {
    notFound()
  }

  return (
    <main>
      <ImageViewer manga={hashaMangas[id]} />
    </main>
  )
}
