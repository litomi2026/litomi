import { redirect } from 'next/navigation'

export default async function Page() {
  return redirect('/mangas/latest/1')
}
