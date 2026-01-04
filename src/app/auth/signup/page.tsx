import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import styles from '../authTheme.module.css'
import SignupForm from './SignupForm'

export const metadata: Metadata = {
  title: '회원가입',
  openGraph: {
    ...defaultOpenGraph,
    title: `회원가입 - ${SHORT_NAME}`,
    url: '/auth/signup',
  },
  alternates: {
    canonical: '/auth/signup',
    languages: { ko: '/auth/signup' },
  },
}

export default function Page() {
  return (
    <main className={`min-h-dvh flex items-center justify-center p-4 ${styles.background}`}>
      <h1 className="sr-only">회원가입</h1>
      <div className={`${styles.card} w-full max-w-lg rounded-2xl p-5 sm:p-6`}>
        <SignupForm />
      </div>
    </main>
  )
}
