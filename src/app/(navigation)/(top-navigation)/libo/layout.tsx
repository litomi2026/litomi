import type { Metadata } from 'next'

import { generateOpenGraphMetadata } from '@/constants'

import LiboNavigation from './LiboNavigation'

export const metadata: Metadata = {
  title: '리보',
  ...generateOpenGraphMetadata({
    title: '리보',
    url: '/libo',
  }),
  alternates: {
    canonical: '/libo',
    languages: { ko: '/libo' },
  },
}

export default function LiboLayout({ children }: LayoutProps<'/libo'>) {
  return <LiboNavigation>{children}</LiboNavigation>
}
