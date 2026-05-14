'use client'

import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

import { SearchParamKey } from '@/constants/storage'

type Props = {
  children: ReactNode
}

export default function LoginButton({ children }: Readonly<Props>) {
  const pathname = usePathname()

  return (
    <Link
      className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 bg-brand-gradient text-background font-semibold rounded-xl transition relative hover:opacity-90 active:opacity-100 
      before:absolute before:inset-0 before:rounded-xl before:border-3 before:border-foreground/40"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(pathname)}`}
      prefetch={false}
    >
      <LogIn className="size-5" />
      {children}
    </Link>
  )
}
