import ImageViewer from '@/components/ImageViewer/ImageViewer'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { CANONICAL_URL } from '@/constants/url'
import { fetchMangaFromHiyobi, fetchMangaImagesFromHiyobi, fetchMangaImagesFromKHentai } from '@/crawler/hiyobi'
import { Manga } from '@/types/manga'
import { BasePageProps } from '@/types/nextjs'
import { getImageSrc } from '@/utils/manga'
import { validateId } from '@/utils/param'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'error'
export const revalidate = 86400 // 1 day

export async function generateMetadata({ params }: BasePageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params
  const idNumber = validateId(id)

  if (!idNumber) {
    return parent as Metadata
  }

  const manga = await fetchMangaFromHiyobi({ id: idNumber })

  if (!manga) {
    return parent as Metadata
  }

  const { title, images } = manga

  return {
    alternates: {
      canonical: `${CANONICAL_URL}/manga/${id}/hi`,
      languages: { ko: `${CANONICAL_URL}/manga/${id}/hi` },
    },
    title: `${title} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      images: images.slice(0, 3).map((path) => getImageSrc({ path, cdn: 'k-hentai', id: +id })),
    },
  }
}

export default async function Page({ params }: BasePageProps) {
  const { id } = await params
  const idNumber = validateId(id)

  if (!idNumber) {
    notFound()
  }

  const [imagesResult, mangaFromHiyobi] = await Promise.all([
    fetchMangaImagesFromHiyobi({ id: idNumber }),
    fetchMangaFromHiyobi({ id: idNumber }),
  ])

  const mangaImagesFromHiyobi = imagesResult || (await fetchMangaImagesFromKHentai({ id: idNumber }))

  if (!mangaImagesFromHiyobi) {
    notFound()
  }

  const manga = {
    ...mangaFromHiyobi,
    id: idNumber,
    images: mangaImagesFromHiyobi,
    cdn: 'k-hentai',
  } as Manga

  return (
    <main>
      <ImageViewer manga={manga} />
    </main>
  )
}
