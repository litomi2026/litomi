import './globals.css'

import type { Metadata, Viewport } from 'next'

import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

import { defaultOpenGraph, DESCRIPTION, SHORT_NAME } from '@/constants'
import { AMPLITUDE_API_KEY, GA_ID, GTM_ID } from '@/constants/env'
import { CANONICAL_URL } from '@/constants/url'
import AmplitudeLazy from '@/lib/amplitude/AmplitudeLazy'

import QueryProvider from '../components/QueryProvider'

const PretendardVariable = localFont({
  src: '../fonts/PretendardVariable.400-700.3713.woff2',
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

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_URL),
  title: SHORT_NAME,
  description: DESCRIPTION,
  applicationName: SHORT_NAME,
  keywords: 'litomi, manga, comic, webtoon, manhwa, manhua, 리토미, 망가, 만화, 웹툰',
  robots: 'index, follow',
  alternates: {
    canonical: CANONICAL_URL,
    languages: { ko: CANONICAL_URL },
  },
  openGraph: defaultOpenGraph,
  other: {
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    rating: 'adult',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Readonly<Props>) {
  return (
    <html className="h-full" lang="ko">
      <head>
        <meta content={SHORT_NAME} name="apple-mobile-web-app-title" />
      </head>
      <body className={`${PretendardVariable.className} antialiased h-full`}>
        <QueryProvider>{children}</QueryProvider>
        <Toaster duration={3000} position="top-center" richColors theme="dark" />
        {process.env.VERCEL === '1' && <SpeedInsights />}
        <Analytics />
        {AMPLITUDE_API_KEY && <AmplitudeLazy apiKey={AMPLITUDE_API_KEY} />}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  )
}
