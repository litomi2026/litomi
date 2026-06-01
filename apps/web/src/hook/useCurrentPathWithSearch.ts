'use client'

import { useEffect, useState } from 'react'

import { usePathname } from '@/i18n/navigation'
import { getPathWithSearch } from '@/lib/auth-redirect'

export default function useCurrentPathWithSearch() {
  const pathname = usePathname()
  const [pathWithSearch, setPathWithSearch] = useState(pathname)

  useEffect(() => {
    setPathWithSearch(getPathWithSearch(pathname, window.location.search))
  }, [pathname])

  return pathWithSearch
}
