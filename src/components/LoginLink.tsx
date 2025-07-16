'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps } from 'react'

import { SearchParamKey } from '@/constants/storage'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function LoginLink({ className = '', children, ...props }: Readonly<Props>) {
  const pathname = usePathname()

  return (
    <Link
      {...props}
      className={`font-bold text-xs ${className}`}
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(pathname)}`}
    >
      {children}
    </Link>
  )
}
