'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  i: number
}

export default function ArrowKeyNavigation({ i }: Props) {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown({ code }: KeyboardEvent) {
      const newSearchParams = new URLSearchParams()

      if (code === 'ArrowLeft') {
        newSearchParams.set('i', String(Math.max(1, i - 1)))
        router.replace(`?${newSearchParams}`)
      } else if (code === 'ArrowRight') {
        newSearchParams.set('i', String(i + 1))
        router.replace(`?${newSearchParams}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [i, router])

  return null
}
