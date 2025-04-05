'use client'

import Link from 'next/link'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<typeof Link> {
  children?: React.ReactNode
}

export default function LinkScrollToTop({ children, ...props }: Props) {
  return (
    <Link {...props} onClick={() => window.scrollTo({ top: 0 })}>
      {children}
    </Link>
  )
}
