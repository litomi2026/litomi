import { MAX_MANGA_DESCRIPTION_LENGTH, MAX_MANGA_TITLE_LENGTH } from '@litomi/domain/manga/policy'
import { createKHentaiThumbnailCoverURL } from '@litomi/http/image-proxy'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import PostList from '@/app/[locale]/(navigation)/(right-aside)/posts/[filter]/PostList'
import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import { getManga } from '@/app/[locale]/manga/[id]/common.server'
import RatingInput from '@/app/[locale]/manga/[id]/RatingInput/RatingInput'
import { mangaSchema } from '@/app/[locale]/manga/[id]/schema'
import BackButton from '@/components/BackButton'
import PostCreationForm from '@/components/post/PostCreationForm'
import MangaReportButton from '@/components/report/MangaReportButton'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import AlsoViewedSection from './AlsoViewedSection'
import PublicLibrarySection from './PublicLibrarySection'
import RatingDistributionSection from './RatingDistributionSection'
import RecommendedByUsersSection from './RecommendedByUsersSection'
import RelatedMangaSection from './RelatedMangaSection'

export async function generateMetadata({ params }: PageProps<'/[locale]/manga/[id]/detail'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.manga' })
  const manga = await getManga(id, locale)
  const mangaTitle = (manga?.title ?? t('fallbackTitle', { id })).slice(0, MAX_MANGA_TITLE_LENGTH)
  const title = t('detailTitle', { title: mangaTitle })
  const description = manga?.description?.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      images: createKHentaiThumbnailCoverURL(id),
      locale,
      pathname: `/manga/${id}/detail`,
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/manga/[id]/detail'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data
  const t = await getTranslations('MangaViewer.detail')

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-4 bg-background/90 backdrop-blur border-b px-4 pb-4 pt-[calc(1rem+var(--safe-area-top))]">
        <BackButton
          className="hover:bg-zinc-500/20 focus-visible:outline-zinc-500 rounded-full p-2 -m-2 transition"
          fallbackUrl={`/manga/${id}`}
        />
        <h2 className="text-xl font-bold">{t('pageTitle')}</h2>
        <div className="ml-auto">
          <MangaReportButton className="border-0" mangaId={id} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col flex-1">
        <RelatedMangaSection mangaId={id} />
        <RecommendedByUsersSection mangaId={id} />
        <AlsoViewedSection mangaId={id} />
        <PublicLibrarySection mangaId={id} />
        <RatingDistributionSection mangaId={id} />
        <div className="border-b">
          <RatingInput className="p-4 py-8" mangaId={id} />
        </div>
        <PostCreationForm className="flex p-4 border-b" mangaId={id} placeholder={t('postPlaceholder')} />
        <PostList source={{ type: 'manga', mangaId: id }} />
      </div>
      <MobileNavigationSpacer />
    </main>
  )
}
