import './globals.css'

import type { Metadata, Viewport } from 'next'

import { SHORT_NAME } from '@/constants'
import { GA_ID, GTM_ID } from '@/constants/env'
import { CANONICAL_URL } from '@/constants/url'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

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
  applicationName: SHORT_NAME,
  robots: 'index, follow',
  alternates: {
    canonical: CANONICAL_URL,
    languages: { ko: CANONICAL_URL },
  },
  other: { RATING: 'RTA-5042-1996-1400-1577-RTA' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Readonly<Props>) {
  return (
    <html lang="ko">
      <head>
        <meta content={SHORT_NAME} name="apple-mobile-web-app-title" />
      </head>
      <body className={`${PretendardVariable.className} antialiased`}>
        {children}
        <Toaster duration={3000} position="top-center" richColors theme="dark" />
        <SpeedInsights />
        <Analytics />
      </body>
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  )
}
