import { redirect } from 'next/navigation'

export const dynamic = 'error'

export default async function Page() {
  return redirect('/manga/3542485')
}
