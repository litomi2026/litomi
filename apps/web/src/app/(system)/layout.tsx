import { DEFAULT_LOCALE } from '@litomi/domain/locale'

import '../globals.css'

import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import QueryProvider from '@/lib/react-query/QueryProvider'

const PretendardVariable = localFont({
  src: '../../fonts/PretendardVariable.400-700.3713.woff2',
  display: 'swap',
  weight: '400 700',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'system-ui',
    'Roboto',
    'Helvetica Neue',
    'Segoe UI',
    'Apple SD Gothic Neo',
    'Noto Sans KR',
    'Malgun Gothic',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'sans-serif',
  ],
})

type Props = {
  children: ReactNode
}

export default function SystemRootLayout({ children }: Props) {
  return (
    <html className="h-full" lang={DEFAULT_LOCALE}>
      <body className={twMerge(PretendardVariable.className, 'h-full antialiased')}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
