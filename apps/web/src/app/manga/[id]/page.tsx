import type { Book, WithContext } from 'schema-dts'

import {
  BLACKLISTED_MANGA_IDS,
  MAX_MANGA_DESCRIPTION_LENGTH,
  MAX_MANGA_TITLE_LENGTH,
} from '@litomi/domain/manga/policy'
import { env } from '@litomi/env/client'
import { createKHentaiThumbnailCoverURL } from '@litomi/http/image-proxy'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { generateOpenGraphMetadata } from '@/lib/metadata'
import { toAbsoluteUrl } from '@/utils/url'

import { getManga } from './common.server'
import Forbidden from './Forbidden'
import MangaPage from './MangaPage'
import { mangaSchema } from './schema'

export async function generateMetadata({ params }: PageProps<'/manga/[id]'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    return {
      title: '403 Forbidden',
      description: '규정에 따라 볼 수 없는 작품이에요.',
    }
  }

  const manga = await getManga(id)
  const title = manga?.title?.slice(0, MAX_MANGA_TITLE_LENGTH) || `작품 #${id}`
  const description = manga?.description?.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)

  return {
    title,
    description,
    ...generateOpenGraphMetadata({
      title,
      description,
      images: createKHentaiThumbnailCoverURL(id),
      url: `/manga/${id}`,
    }),
    alternates: {
      canonical: `/manga/${id}`,
      languages: { ko: `/manga/${id}` },
    },
  }
}

export default async function Page({ params }: PageProps<'/manga/[id]'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  if (BLACKLISTED_MANGA_IDS.includes(id)) {
    return <Forbidden />
  }

  const manga = await getManga(id)
  const pageURL = new URL(`/manga/${id}`, env.NEXT_PUBLIC_APP_ORIGIN).toString()

  const jsonLd: WithContext<Book> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': pageURL,
    url: pageURL,
    name: manga?.title ?? '작품',
    inLanguage: 'ko',
    image: [toAbsoluteUrl(manga?.images?.[0]?.original?.url ?? createKHentaiThumbnailCoverURL(id))],
    isAccessibleForFree: true,
    potentialAction: {
      '@type': 'ReadAction',
      target: [pageURL],
    },
    ...(manga?.description && { description: manga.description }),
    ...(manga?.date && { datePublished: manga.date }),
    ...(manga?.count && { numberOfPages: manga.count }),
    ...(manga?.type?.label && { genre: manga.type.label }),
    ...(manga?.artists?.length && {
      author: manga.artists.map((artist) => ({
        '@type': 'Person',
        name: artist.label,
      })),
    }),
    ...(manga?.tags?.length && { keywords: manga.tags.map((t) => t.label).join(', ') }),
  }

  return (
    <main className="h-full">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        type="application/ld+json"
      />
      <MangaPage id={id} initialManga={manga} />
    </main>
  )
}
