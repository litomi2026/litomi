import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  return redirect('/mangas/1/hi/card')
}
