import { DEFAULT_LOCALE } from '@litomi/domain/locale'

import '../globals.css'

import type { ReactNode } from 'react'

import QueryProvider from '@/lib/react-query/QueryProvider'

type Props = {
  children: ReactNode
}

export default function SystemRootLayout({ children }: Props) {
  return (
    <html className="h-full" lang={DEFAULT_LOCALE}>
      <body className="h-full antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
