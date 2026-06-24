'use client'

import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'

import useCurrentPathWithSearch from '@/hook/useCurrentPathWithSearch'
import { Link } from '@/i18n/navigation'
import { getAuthRedirectHref } from '@/lib/auth-redirect'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function LoginPageLink({ className = '', children }: Props) {
  const redirect = useCurrentPathWithSearch()

  return (
    <Link
      className={twMerge('font-bold text-xs p-2 -m-2', className)}
      href={getAuthRedirectHref('/auth/login', redirect)}
    >
      {children}
    </Link>
  )
}
