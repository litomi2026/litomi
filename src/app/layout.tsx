import './globals.css'

import type { Metadata } from 'next'

import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

const PretendardVariable = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
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

export const metadata: Metadata = {
  title: 'Litomi',
  description: 'Litomi is a Hitomi.la mirror.',
}

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Readonly<Props>) {
  return (
    <html lang="ko">
      <body className={`${PretendardVariable.className} antialiased`}>
        <Toaster />
        {children}
      </body>
    </html>
  )
}
