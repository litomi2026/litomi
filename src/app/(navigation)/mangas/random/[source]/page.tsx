import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  redirect(`/mangas/random/hi/card`)
}
