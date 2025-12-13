'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, useEffect, useState } from 'react'

import { SearchParamKey } from '@/constants/storage'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function LoginPageLink({ className = '', children, ...props }: Readonly<Props>) {
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
      className={`font-bold text-xs ${className}`}
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
    >
      {children}
    </Link>
  )
}
