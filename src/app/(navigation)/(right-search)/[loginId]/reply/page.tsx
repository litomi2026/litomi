import { notFound } from 'next/navigation'

import type { BasePageProps } from '@/types/nextjs'

// TEMP
export const dynamic = 'error'

export default async function Page({ params: _ }: BasePageProps) {
  notFound()
}
