import { Metadata } from 'next'
import { z } from 'zod'

import { generateOpenGraphMetadata } from '@/constants'
import { View } from '@/utils/param'

import NotFound from './[id]/not-found'
import AllLibraryMangaView from './AllLibraryMangaView'

export const metadata: Metadata = {
  title: '공개 서재',
  ...generateOpenGraphMetadata({
    title: '공개 서재',
    url: '/library',
  }),
  alternates: {
    canonical: '/library',
    languages: { ko: '/library' },
  },
}

const searchParamsSchema = z.object({
  view: z.enum(View).default(View.CARD),
})

export default async function LibraryPage({ searchParams }: PageProps<'/library'>) {
  const validation = searchParamsSchema.safeParse(await searchParams)

  if (!validation.success) {
    return <NotFound />
  }

  const { view } = validation.data

  return (
    <main className="flex-1">
      <AllLibraryMangaView initialView={view} />
    </main>
  )
}
