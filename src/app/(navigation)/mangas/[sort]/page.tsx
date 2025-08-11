import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  redirect(`/mangas/latest/1/hi/card`)
}
