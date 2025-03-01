import './globals.css'

import type { Metadata } from 'next'

import ServiceWorker from '@/components/ServiceWorker'
import { GA_ID, GTM_ID } from '@/constants/env'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
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
      <head>
        <meta content="Litomi" name="apple-mobile-web-app-title" />
      </head>
      <body className={`${PretendardVariable.className} antialiased`}>
        <Toaster />
        <ServiceWorker path="/sw.js" />
        {children}
      </body>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
