'use client'

import { type ComponentProps, useEffect, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { SearchParamKey } from '@/storage'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function SignupLink({ children, ...props }: Props) {
  const [href, setHref] = useState('/auth/signup')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get(SearchParamKey.REDIRECT)

    if (!redirect) {
      return
    }

    setHref(`/auth/signup?${SearchParamKey.REDIRECT}=${encodeURIComponent(redirect)}`)
  }, [])

  return (
    <Link {...props} href={href}>
      {children}
    </Link>
  )
}
