import Link from 'next/link'

import { SearchParamKey } from '@/constants/storage'

import IconLogin from './icons/IconLogin'

type Props = {
  children: React.ReactNode
  redirect: string
}

export default function LoginButton({ children, redirect }: Props) {
  return (
    <Link
      className="inline-flex items-center gap-2 px-4 py-3 bg-brand-gradient text-background font-semibold rounded-xl 
      hover:opacity-90 active:opacity-100 transition relative
      before:absolute before:inset-0 before:rounded-xl before:border-3 before:border-foreground/40"
      href={`/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(redirect)}`}
    >
      <IconLogin className="w-5 h-5" />
      {children}
    </Link>
  )
}
