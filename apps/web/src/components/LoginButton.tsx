'use client'

import { LogIn } from 'lucide-react'
import { ReactNode } from 'react'

import LinkPending from '@/components/LinkPending'
import { getStatusActionClassName } from '@/components/status/styles'
import useCurrentPathWithSearch from '@/hook/useCurrentPathWithSearch'
import { Link } from '@/i18n/navigation'
import { getAuthRedirectHref } from '@/lib/auth-redirect'

type Props = {
  children: ReactNode
}

export default function LoginButton({ children }: Props) {
  const redirect = useCurrentPathWithSearch()

  return (
    <Link className={getStatusActionClassName('primary')} href={getAuthRedirectHref('/auth/login', redirect)}>
      <LinkPending className="size-5">
        <LogIn className="size-5" />
      </LinkPending>
      {children}
    </Link>
  )
}
