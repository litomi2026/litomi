import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return <div className="flex grow flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 lg:px-6">{children}</div>
}
