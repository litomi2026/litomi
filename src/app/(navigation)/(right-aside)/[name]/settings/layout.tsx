import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function SettingsLayout({ children }: Readonly<Props>) {
  return <div className="flex flex-col grow gap-2 p-2 max-w-prose mx-auto w-full md:p-4 md:gap-4">{children}</div>
}
