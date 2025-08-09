import { redirect } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

// TODO: 추후 삭제
export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const { page } = await searchParams
  return redirect(`/manga/${id}?page=${page}`)
}
