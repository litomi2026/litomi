import { BasePageProps } from '@/types/nextjs'
import { validateOrder, validateSort } from '@/utils/param'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, order } = await params
  const sortString = validateSort(sort)
  const orderString = validateOrder(order)

  if (!sortString || !orderString) {
    notFound()
  }

  redirect(`/mangas/${sortString}/${orderString}/1`)
}
