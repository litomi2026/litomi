'use client'

import { useEffect } from 'react'

export default function CollapsibleSectionOpen({ id }: { id: string }) {
  useEffect(() => {
    if (!id) {
      return
    }

    const checkAndOpenDetails = () => {
      const hash = window.location.hash.slice(1)
      const details = document.getElementById(id) as HTMLDetailsElement | null
      if (hash === id && details) {
        details.open = true
        details.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    checkAndOpenDetails()

    window.addEventListener('hashchange', checkAndOpenDetails)

    return () => {
      window.removeEventListener('hashchange', checkAndOpenDetails)
    }
  }, [id])

  return null
}
