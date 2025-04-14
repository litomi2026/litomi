import { BasePageProps } from '@/types/nextjs'
import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  const { sort, page } = await params
  redirect(`/mangas/${sort}/${page}/hi`)
}
