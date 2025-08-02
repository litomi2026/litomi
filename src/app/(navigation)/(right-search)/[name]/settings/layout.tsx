import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SettingsLayout({ children }: Readonly<Props>) {
  return <div className="grid gap-4 p-4 max-w-prose mx-auto w-full md:p-8 md:gap-6">{children}</div>
}
