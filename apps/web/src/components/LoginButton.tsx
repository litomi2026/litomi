'use client'

import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import { getStatusActionClassName } from '@/components/status/styles'
import { SearchParamKey } from '@/storage'

type Props = {
  children: ReactNode
}

export default function LoginButton({ children }: Props) {
  const pathname = usePathname()

  return (
    <Link
      className={getStatusActionClassName('primary')}
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(pathname)}`}
      prefetch={false}
    >
      <LogIn className="size-5" />
      {children}
    </Link>
  )
}
