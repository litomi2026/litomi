import { redirect } from 'next/navigation'

export const dynamic = 'force-static'

export default async function Page() {
  redirect('/new/1')
}
