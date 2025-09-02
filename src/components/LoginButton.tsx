'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

import { SearchParamKey } from '@/constants/storage'

import IconLogin from './icons/IconLogin'

type Props = {
  children: ReactNode
}

export default function LoginButton({ children }: Readonly<Props>) {
  return (
    <Link
      className="inline-flex items-center justify-center gap-2 w-full max-w-3xs p-3 bg-brand-gradient text-background font-semibold rounded-xl 
      hover:opacity-90 active:opacity-100 transition relative
      before:absolute before:inset-0 before:rounded-xl before:border-3 before:border-foreground/40"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(window.location.pathname + window.location.search)}`}
    >
      <IconLogin className="w-5 h-5" />
      {children}
    </Link>
  )
}
