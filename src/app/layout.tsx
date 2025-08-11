import './globals.css'

import type { Metadata, Viewport } from 'next'

import { GoogleAnalytics } from '@next/third-parties/google'
import dynamic from 'next/dynamic'
import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { defaultOpenGraph, DESCRIPTION, SHORT_NAME } from '@/constants'
import { AMPLITUDE_API_KEY, GA_ID, GTM_ID, VERCEL_ANALYTICS, VERCEL_SPEED_INSIGHTS } from '@/constants/env'
import { CANONICAL_URL } from '@/constants/url'

import QueryProvider from '../components/QueryProvider'

// NOTE: 사용하지 않을 수 있어서 dynamic import
const Amplitude = dynamic(() => import('@/lib/amplitude/Amplitude'))
const Analytics = dynamic(() => import('@vercel/analytics/react').then((mod) => mod.Analytics))
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights))
const GoogleTagManager = dynamic(() => import('@next/third-parties/google').then((mod) => mod.GoogleTagManager))

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
        <ServiceWorkerRegistrar />
        <Toaster duration={3000} position="top-center" richColors theme="dark" />
        {VERCEL_SPEED_INSIGHTS && <SpeedInsights />}
        {VERCEL_ANALYTICS && <Analytics />}
        {AMPLITUDE_API_KEY && <Amplitude apiKey={AMPLITUDE_API_KEY} />}
        {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  )
}
