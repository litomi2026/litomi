import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import TagDictionary from './dictionary'
import { getDictionaryCategoryStats } from './dictionary-utils'
import { getLocalizedTagDictionary } from './get-localized-dictionary'

export async function generateMetadata({ params }: PageProps<'/[locale]/tag/dictionary'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const metadataT = await getTranslations({ locale, namespace: 'Metadata.explore.tag' })
  const tagT = await getTranslations({ locale, namespace: 'Tag' })
  const title = tagT('views.dictionary')
  const description = metadataT('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: '/tag/dictionary',
    }),
  }
}

export default async function Page({ params }: PageProps<'/[locale]/tag/dictionary'>) {
  const locale = await getLocaleFromParams(params)
  const entries = getLocalizedTagDictionary(locale)
  const categoryStats = getDictionaryCategoryStats(entries)

  return <TagDictionary categoryStats={categoryStats} entries={entries} totalEntryCount={entries.length} />
}
