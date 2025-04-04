'use client'

import IconArrow from '@/components/icons/IconArrow'
import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      className="hover:bg-zinc-500/20 hover:dark:bg-zinc-500/50 focus-visible:outline-zinc-500 focus:dark:outline-zinc-200 rounded-full p-2 transition"
      onClick={() => router.back()}
    >
      <IconArrow className="w-6 rotate-180" />
    </button>
  )
}
