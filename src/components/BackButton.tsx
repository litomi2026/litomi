'use client'

import IconArrow from '@/components/icons/IconArrow'
import { useRouter } from 'next/navigation'
import { ComponentProps } from 'react'

export default function BackButton(props: ComponentProps<'button'>) {
  const router = useRouter()

  return (
    <button {...props} onClick={() => router.back()} type="button">
      <IconArrow className="w-6 rotate-180" />
    </button>
  )
}
