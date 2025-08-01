import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SettingsLayout({ children }: Readonly<Props>) {
  return children
}