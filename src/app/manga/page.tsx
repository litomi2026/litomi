import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  return redirect('/mangas/id/desc/1')
}
