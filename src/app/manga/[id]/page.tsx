import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { KHentaiClient } from '@/crawler/k-hentai'

import MangaViewer from './MangaViewer'
import { mangaSchema } from './schema'

export const dynamic = 'error'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return {
    title: `작품 - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      title: `작품 - ${SHORT_NAME}`,
      url: `/manga/${id}`,
    },
    alternates: {
      canonical: `/manga/${id}`,
      languages: { ko: `/manga/${id}` },
    },
  }
}

export async function generateStaticParams() {
  const kHentaiIds = await KHentaiClient.getInstance()
    .searchKoreanMangas()
    .then((mangas) => mangas.map((manga) => String(manga.id)))
    .catch(() => [])

  return kHentaiIds.map((id) => ({ id }))
}

export default async function Page({ params }: PageProps) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return (
    <main>
      <MangaViewer id={id} />
    </main>
  )
}
