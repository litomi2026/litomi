import { BasePageProps } from '@/types/nextjs'
import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, order, page } = await params
  redirect(`/mangas/${sort}/${order}/${page}/hi`)
}
