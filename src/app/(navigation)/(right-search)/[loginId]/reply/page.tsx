import { notFound } from 'next/navigation'

import type { PageProps } from '@/types/nextjs'

// TEMP
export const dynamic = 'error'

export default async function Page({ params: _ }: PageProps) {
  notFound()
}
