import { BasePageProps } from '@/types/nextjs'
import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, order } = await params
  redirect(`/mangas/${sort}/${order}/1/hi`)
}
