import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod/v4'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `신작 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `신작 - ${SHORT_NAME}`,
    url: '/mangas/new',
  },
  alternates: {
    canonical: '/mangas/new',
    languages: { ko: '/mangas/new' },
  },
}

const mangasNewSchema = z.object({
  page: z.coerce.number().int().positive(),
})

export default async function Page({ params }: PageProps<'/mangas/new/[page]'>) {
  const validation = mangasNewSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { page } = validation.data

  return <div>{page}</div>
}
