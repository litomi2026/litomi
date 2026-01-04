import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import styles from '../authTheme.module.css'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: '로그인',
  openGraph: {
    ...defaultOpenGraph,
    title: `로그인 - ${SHORT_NAME}`,
    url: '/auth/login',
  },
  alternates: {
    canonical: '/auth/login',
    languages: { ko: '/auth/login' },
  },
}

export default function Page() {
  return (
    <main className={`min-h-dvh flex items-center justify-center p-4 ${styles.background}`}>
      <h1 className="sr-only">로그인</h1>
      <div className={`${styles.card} w-full max-w-lg rounded-2xl p-5 sm:p-6`}>
        <LoginForm />
      </div>
    </main>
  )
}
