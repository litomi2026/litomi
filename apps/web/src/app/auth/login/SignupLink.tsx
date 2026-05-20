'use client'

import { SearchParamKey } from '@litomi/domain/constants/storage'
import Link from 'next/link'
import { type ComponentProps, useEffect, useState } from 'react'

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
