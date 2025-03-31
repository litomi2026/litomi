import { BasePageProps } from '@/types/nextjs'
import { validateSort } from '@/utils/param'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort } = await params
  const sortString = validateSort(sort)

  if (!sortString) {
    notFound()
  }

  return redirect(`/mangas/${sortString}/desc/1`)
}
