import { useLinkStatus } from 'next/link'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren

export default function MangaMetadataLabel({ children }: Props) {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-busy={pending}
      className="transition aria-busy:animate-pulse aria-busy:text-zinc-400 aria-busy:font-semibold"
    >
      {children}
    </span>
  )
}
