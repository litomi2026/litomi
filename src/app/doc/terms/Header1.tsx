'use client'

import { useRouter } from 'next/navigation'

export default function Header1() {
  const router = useRouter()

  return (
    <h1 className="text-3xl font-bold mb-6" onClick={() => router.push('/webtoon')}>
      이용약관
    </h1>
  )
}
