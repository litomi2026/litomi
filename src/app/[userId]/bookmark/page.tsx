import type { BasePageProps } from '@/types/nextjs'

import MemberOnly from '@/components/MemberOnly'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page({ params }: BasePageProps) {
  return (
    <div className="p-4">
      <pre className="overflow-x-scroll">{JSON.stringify({ params }, null, 2)}</pre>
      <MemberOnly />
    </div>
  )
}
