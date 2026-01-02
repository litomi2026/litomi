'use client'

import { Loader2 } from 'lucide-react'
import { useLinkStatus } from 'next/link'
import { PropsWithChildren } from 'react'

export default function MangaTagLabel({ children }: PropsWithChildren) {
  const { pending } = useLinkStatus()

  return (
    <span className="relative">
      {pending && (
        <Loader2
          aria-hidden={!pending}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition aria-hidden:opacity-0 text-foreground p-0.5 w-5 animate-spin"
        />
      )}
      <span aria-hidden={pending} className="aria-hidden:opacity-0 transition">
        {children}
      </span>
    </span>
  )
}
