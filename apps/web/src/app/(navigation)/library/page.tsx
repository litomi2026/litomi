import { generateOpenGraphMetadata } from '@litomi/domain/constants'
import { View } from '@litomi/std/param'
import { Metadata } from 'next'
import { z } from 'zod'

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

  return <AllLibraryMangaView initialView={view} />
}
