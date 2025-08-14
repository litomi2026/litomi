import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  redirect('/mangas/1/hi/card')
}
