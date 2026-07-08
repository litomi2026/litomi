import {
  BLACKLISTED_MANGA_IDS,
  MANGA_DESCRIPTION_MAX_LENGTH,
  MANGA_TITLE_MAX_LENGTH,
} from '@litomi/domain/manga/policy'
import { env } from '@litomi/env/client'
import { createKHentaiThumbnailCoverURL } from '@litomi/http/image-proxy'
import { truncateAtWordBoundary } from '@litomi/std'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Book, WithContext } from 'schema-dts'

import { getPathname } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import { toAbsoluteUrl } from '@/utils/url'

import { getManga } from './common.server'
import Forbidden from './Forbidden'
import MangaPage from './page.client'
import { mangaSchema } from './schema'

export async function generateMetadata({ params }: PageProps<'/[locale]/manga/[id]'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.manga' })

  if (BLACKLISTED_MANGA_IDS.has(id)) {
    return {
      title: '403 Forbidden',
      description: t('forbiddenDescription'),
    }
  }

  const manga = await getManga(id, locale)
  const title = truncateAtWordBoundary(manga?.title, MANGA_TITLE_MAX_LENGTH) || t('fallbackTitle', { id })
  const description = manga?.description?.slice(0, MANGA_DESCRIPTION_MAX_LENGTH)

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      images: createKHentaiThumbnailCoverURL(id),
      locale,
      pathname: `/manga/${id}`,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/manga/[id]'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  if (BLACKLISTED_MANGA_IDS.has(id)) {
    return <Forbidden />
  }

  const locale = await getLocaleFromParams(params)
  const manga = await getManga(id, locale)
  const t = await getTranslations({ locale, namespace: 'Metadata.manga' })
  const pageURL = new URL(getPathname({ href: `/manga/${id}`, locale }), env.NEXT_PUBLIC_APP_ORIGIN).toString()

  const jsonLd: WithContext<Book> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': pageURL,
    url: pageURL,
    name: manga?.title ?? t('defaultJsonLdName'),
    inLanguage: locale,
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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data; '<' is escaped to prevent XSS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }}
        type="application/ld+json"
      />
      <MangaPage id={id} initialManga={manga} />
    </main>
  )
}
