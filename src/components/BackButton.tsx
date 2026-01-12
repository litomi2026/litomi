'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<'button'> {
  fallbackUrl?: string
}

export default function BackButton({ fallbackUrl, ...props }: Props) {
  const router = useRouter()

  function handleClick() {
    if (window.history.length > 1) {
      router.back()
    } else if (fallbackUrl) {
      router.replace(fallbackUrl)
    }
  }

  return (
    <button {...props} onClick={handleClick} title="뒤로가기" type="button">
      <ArrowRight className="size-6 rotate-180" />
    </button>
  )
}
