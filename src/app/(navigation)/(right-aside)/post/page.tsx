import { redirect } from 'next/navigation'

import { getPostDetailHref } from '@/components/post/postHref'

export const dynamic = 'error'

export default async function Page() {
  redirect(getPostDetailHref(1))
}
