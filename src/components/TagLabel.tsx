import { useLinkStatus } from 'next/link'
import { PropsWithChildren } from 'react'

import IconSpinner from './icons/IconSpinner'

type Props = PropsWithChildren & {
  className?: string
}

export default function TagLabel({ children, className = '' }: Props) {
  const { pending } = useLinkStatus()

  return (
    <span className="relative">
      {pending && (
        <IconSpinner
          aria-hidden={!pending}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition aria-hidden:opacity-0 text-foreground ${className}`}
        />
      )}
      <span aria-hidden={pending} className="aria-hidden:opacity-0 transition">
        {children}
      </span>
    </span>
  )
}
