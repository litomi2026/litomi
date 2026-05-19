import { APP_ORIGIN, defaultOpenGraph, SHORT_NAME } from '@litomi/domain/constants'
import { PostFilter } from '@litomi/domain/post/filter'
import { Book } from 'lucide-react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import PostList from '@/app/(navigation)/(right-aside)/posts/[filter]/MasonryPostList'
import RatingInput from '@/app/manga/[id]/RatingInput/RatingInput'
import { mangaSchema } from '@/app/manga/[id]/schema'
import BackButton from '@/components/BackButton'
import PostCreationForm from '@/components/post/PostCreationForm'
import MangaReportButton from '@/components/report/MangaReportButton'
import { MobileNavigationSpacer } from '@/components/ScrollSpacers'

import AlsoViewedSection from './AlsoViewedSection'
import PublicLibrarySection from './PublicLibrarySection'
import RatingDistributionSection from './RatingDistributionSection'
import RecommendedByUsersSection from './RecommendedByUsersSection'
import RelatedMangaSection from './RelatedMangaSection'

export async function generateMetadata({ params }: PageProps<'/manga/[id]/detail'>): Promise<Metadata> {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return {
    title: `작품 상세 #${id}`,
    openGraph: {
      ...defaultOpenGraph,
      title: `작품 상세 #${id} - ${SHORT_NAME}`,
      url: `${APP_ORIGIN}/manga/${id}/detail`,
    },
  }
}

export default async function Page({ params }: PageProps<'/manga/[id]/detail'>) {
  const validation = mangaSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id } = validation.data

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 flex items-center gap-4 bg-background/90 backdrop-blur border-b px-4 pb-4 pt-[calc(1rem+var(--safe-area-top))]">
        <BackButton
          className="hover:bg-zinc-500/20 focus-visible:outline-zinc-500 rounded-full p-2 -m-2 transition"
          fallbackUrl={`/manga/${id}`}
        />
        <h2 className="text-xl font-bold">작품 상세</h2>
        <div className="ml-auto">
          <MangaReportButton mangaId={id} />
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
        <PostCreationForm className="flex p-4 border-b" mangaId={id} placeholder="이 작품은 어땠나요?" />
        <PostList filter={PostFilter.MANGA} mangaId={id} NotFound={<EmptyState />} />
      </div>
      <MobileNavigationSpacer />
    </main>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 p-4 text-center">
      <Book className="size-8 mb-4 text-brand" role="img" />
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">이 작품에 대한 글이 없어요</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">첫 번째로 이 작품에 대해 이야기해보세요!</p>
    </div>
  )
}
