import './globals.css'

import type { Metadata, Viewport } from 'next'

import { APPLICATION_NAME, DESCRIPTION, SHORT_NAME, THEME_COLOR } from '@litomi/domain/app/metadata'
import { env } from '@litomi/env/client'
import { GoogleTagManager } from '@next/third-parties/google'
import localFont from 'next/font/local'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'

import NewYearToastNudge from '@/app/nye/NewYearToastNudge'
import CapacitorNativeEffects from '@/components/CapacitorNativeEffects'
import LibraryModal from '@/components/card/LibraryModal'
import MangaTorrentModal from '@/components/card/MangaTorrentModal'
import HiyobiPing from '@/components/HiyobiPing'
import { MangaDetailModal } from '@/components/MangaDetailModal'
import SEOText from '@/components/SEOText'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import ThemeProvider from '@/components/ThemeProvider'
import OverlayHost from '@/components/ui/OverlayHost'
import { generateOpenGraphMetadata } from '@/lib/metadata'
import QueryProvider from '@/lib/react-query/QueryProvider'

const { NEXT_PUBLIC_APP_ORIGIN, NEXT_PUBLIC_GTM_ID, NEXT_PUBLIC_GTM_SCRIPT_URL } = env

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
  metadataBase: new URL(NEXT_PUBLIC_APP_ORIGIN),
  title: {
    default: APPLICATION_NAME,
    template: `%s - ${SHORT_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SHORT_NAME,
  keywords:
    'litomi, 리토미, litomi.in, litomi.la, hitomi, 히토미, 히토미 뷰어, 히토미 미러, 성인망가, 동인지, 만화, 웹툰, manga, comic, webtoon, hentai',
  referrer: 'same-origin',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: NEXT_PUBLIC_APP_ORIGIN,
    languages: {
      ko: NEXT_PUBLIC_APP_ORIGIN,
      'x-default': NEXT_PUBLIC_APP_ORIGIN,
    },
  },
  ...generateOpenGraphMetadata(),
  verification: { google: 'E8dCRgQMvY3hE4oaZ-vsuhopmTS7qyQG-O5WIMdVenA' },
  other: {
    RATING: 'RTA-5042-1996-1400-1577-RTA',
    rating: 'adult',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: THEME_COLOR,
  colorScheme: 'dark light',
}

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html className="h-full" lang="ko">
      <head>
        <meta content={SHORT_NAME} name="apple-mobile-web-app-title" />
        <meta content="f9b44ff18cfe0010c3c2eeab98eb7a9c" name="juicyads-site-verification" />
        <meta content="c8c42155770cd0c29a31f02c8a926ed2" name="6a97888e-site-verification" />
        {/* eslint-disable-next-line perfectionist/sort-jsx-props */}
        <meta name="Trafficstars" content="84391" />
      </head>
      <body className={`${PretendardVariable.className} antialiased h-full`}>
        <ThemeProvider />
        <CapacitorNativeEffects />
        <OverlayHost>
          <Toaster
            className="pointer-events-auto"
            mobileOffset={{ top: 'calc(1rem + var(--safe-area-top))' }}
            position="top-center"
            theme="system"
          />
        </OverlayHost>
        <QueryProvider>
          {children}
          <LibraryModal />
          <MangaDetailModal />
          <MangaTorrentModal />
        </QueryProvider>
        <ServiceWorkerRegistrar />
        <HiyobiPing />
        <NewYearToastNudge />
        {(NEXT_PUBLIC_GTM_ID || NEXT_PUBLIC_GTM_SCRIPT_URL) && (
          <GoogleTagManager gtmId={NEXT_PUBLIC_GTM_ID} gtmScriptUrl={NEXT_PUBLIC_GTM_SCRIPT_URL} />
        )}
        <p className="h-0 overflow-hidden tracking-widest invisible">
          <SEOText />
        </p>
      </body>
    </html>
  )
}
