import type { Metadata } from 'next'

import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'

import { TAG_DICTIONARY_TYPE_KEYS } from '../../data/tag-dictionary'
import TagDictionary from '../dictionary'
import { getDictionaryCategoryStats } from '../dictionary-utils'
import { getLocalizedTagDictionary } from '../get-localized-dictionary'

export const dynamicParams = false

export async function generateMetadata({ params }: PageProps<'/[locale]/tag/dictionary/[type]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const { type: typeParam } = await params
  const type = TAG_DICTIONARY_TYPE_KEYS.find((typeKey) => typeKey === typeParam)

  if (!type) {
    notFound()
  }

  const metadataT = await getTranslations({ locale, namespace: 'Metadata.explore.tag' })
  const tagT = await getTranslations({ locale, namespace: 'Tag' })
  const title = `${tagT('views.dictionary')} - ${tagT(`dictionary.typeLabels.${type}`)}`
  const description = metadataT('description')

  return {
    title,
    description,
    ...generateLocalizedMetadata({
      title,
      description,
      locale,
      pathname: `/tag/dictionary/${type}`,
    }),
  }
}

export function generateStaticParams() {
  return TAG_DICTIONARY_TYPE_KEYS.map((type) => ({ type }))
}

export default async function Page({ params }: PageProps<'/[locale]/tag/dictionary/[type]'>) {
  const locale = await getLocaleFromParams(params)
  const { type: typeParam } = await params
  const type = TAG_DICTIONARY_TYPE_KEYS.find((typeKey) => typeKey === typeParam)

  if (!type) {
    notFound()
  }

  const entries = getLocalizedTagDictionary(locale)
  const categoryStats = getDictionaryCategoryStats(entries)
  const typeEntries = entries.filter((entry) => entry.tagTypes[0] === type)

  return (
    <TagDictionary categoryStats={categoryStats} entries={typeEntries} totalEntryCount={entries.length} type={type} />
  )
}
