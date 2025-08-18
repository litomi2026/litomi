'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps } from 'react'

import { SearchParamKey } from '@/constants/storage'
import useMounted from '@/hook/useMounted'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function LoginLink({ className = '', children, ...props }: Readonly<Props>) {
  const pathname = usePathname()
  const isMounted = useMounted()

  if (!isMounted) {
    return null
  }

  const searchParams = new URLSearchParams(window.location.search)
  const fullPath = `${pathname}?${searchParams.toString()}`

  return (
    <Link
      {...props}
      className={`font-bold text-xs ${className}`}
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(fullPath)}`}
    >
      {children}
    </Link>
  )
}
