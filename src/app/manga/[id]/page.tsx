import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { generateOpenGraphMetadata, SHORT_NAME } from '@/constants'
import { BLACKLISTED_MANGA_IDS, MAX_MANGA_DESCRIPTION_LENGTH, MAX_MANGA_TITLE_LENGTH } from '@/constants/policy'

import { getManga } from './common.server'
import Forbidden from './Forbidden'
import MangaViewer from './MangaViewer'
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
  const slicedTitle = manga?.title?.slice(0, MAX_MANGA_TITLE_LENGTH) || '작품'
  const slicedDescription = manga?.description?.slice(0, MAX_MANGA_DESCRIPTION_LENGTH)

  return {
    title: `${slicedTitle}`,
    description: slicedDescription,
    ...generateOpenGraphMetadata({
      title: `${slicedTitle} - ${SHORT_NAME}`,
      description: slicedDescription,
      images: manga?.images?.[0]?.original?.url ?? `https://soujpa.in/start/${id}/${id}_0.avif`,
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

  return (
    <main>
      <MangaViewer id={id} initialManga={manga} />
    </main>
  )
}
