import { redirect } from 'next/navigation'

import { BasePageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, page } = await params
  redirect(`/mangas/${sort}/${page}/hi/card`)
}
