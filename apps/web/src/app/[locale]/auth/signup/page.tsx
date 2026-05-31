import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import styles from '../authTheme.module.css'
import SignupForm from './SignupForm'

export async function generateMetadata({ params }: PageProps<'/[locale]/auth/signup'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.auth.signup' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/auth/signup',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/auth/signup'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.auth.signup' })

  return (
    <main className={`min-h-dvh flex items-center justify-center p-4 sm:p-8 ${styles.background}`}>
      <h1 className="sr-only">{t('title')}</h1>
      <div className={`${styles.card} w-full max-w-lg rounded-2xl p-5 sm:p-6`}>
        <SignupForm />
      </div>
    </main>
  )
}
