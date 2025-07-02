import { redirect } from 'next/navigation'

import { BasePageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { source } = await params
  redirect(`/mangas/random/${source}/card`)
}
