import { redirect } from 'next/navigation'

import { PageProps } from '@/types/nextjs'

export const dynamic = 'error'

export default async function Page({ params }: PageProps) {
  const { sort, page } = await params
  redirect(`/mangas/${sort}/${page}/hi/card`)
}
