import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return <div className="flex grow flex-col gap-5 p-4">{children}</div>
}
