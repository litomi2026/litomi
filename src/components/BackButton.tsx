'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ComponentProps } from 'react'

export default function BackButton(props: ComponentProps<'button'>) {
  const router = useRouter()

  return (
    <button {...props} onClick={() => router.back()} type="button">
      <ArrowRight className="size-6 rotate-180" />
    </button>
  )
}
