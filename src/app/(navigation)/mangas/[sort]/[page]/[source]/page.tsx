import { redirect } from 'next/navigation'

import { BasePageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, page, source } = await params
  redirect(`/mangas/${sort}/${page}/${source}/card`)
}
