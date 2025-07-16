import { redirect } from 'next/navigation'

import { PageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: PageProps) {
  const { source } = await params
  redirect(`/mangas/random/${source}/card`)
}
