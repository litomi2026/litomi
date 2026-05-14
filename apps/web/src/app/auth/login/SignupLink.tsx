'use client'

import Link from 'next/link'
import { type ComponentProps, useEffect, useState } from 'react'

import { SearchParamKey } from '@/constants/storage'

type Props = Omit<ComponentProps<typeof Link>, 'href'>

export default function SignupLink({ children, ...props }: Readonly<Props>) {
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
