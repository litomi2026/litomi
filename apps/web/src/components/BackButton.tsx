'use client'

import { ArrowRight } from 'lucide-react'
import { ComponentProps } from 'react'

import { useRouter } from '@/i18n/navigation'

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
    <button {...props} aria-label="뒤로가기" onClick={handleClick} title="뒤로가기" type="button">
      <ArrowRight className="size-6 rotate-180" />
    </button>
  )
}
