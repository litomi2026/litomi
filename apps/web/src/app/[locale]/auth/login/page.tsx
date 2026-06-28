import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import styles from '../authTheme.module.css'
import LoginForm from './LoginForm'

export async function generateMetadata({ params }: PageProps<'/[locale]/auth/login'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.auth.login' })

  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/auth/login',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/auth/login'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'Metadata.auth.login' })

  return (
    <main className={`min-h-dvh flex items-center justify-center sm:p-8 ${styles.background}`}>
      <h1 className="sr-only">{t('title')}</h1>
      <div className={`${styles.card} w-full p-4 sm:max-w-lg sm:rounded-2xl sm:p-6`}>
        <LoginForm />
      </div>
    </main>
  )
}
