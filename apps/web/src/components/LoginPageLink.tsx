'use client'

import { SearchParamKey } from '@litomi/domain/constants/storage'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ComponentProps, useEffect, useState } from 'react'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function LoginPageLink({ className = '', children, ...props }: Props) {
  const pathname = usePathname()
  const [searchParams, setSearchParams] = useState('')
  const fullPath = `${pathname}?${searchParams}`

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search).toString())
  }, [])

  return (
    <Link
      prefetch={false}
      {...props}
      className={`font-bold text-xs p-2 -m-2 ${className}`}
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
    >
      {children}
    </Link>
  )
}
