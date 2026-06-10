'use client'

import { normalizeValue } from '@litomi/domain/utils/normalize-value'
import { formatNumber } from '@litomi/std'
import { BookOpen, Search } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useDeferredValue, useState } from 'react'

import { Link } from '@/i18n/navigation'

import type { TagDictionaryTypeKey } from '../data/tag-dictionary'
import type { DictionaryCategoryStat } from './dictionary-utils'
import type { LocalizedTagDictionaryEntry } from './types'

import { TAG_CATEGORY_PARAMS } from '../categories'

type DictionaryEntryGridProps = {
  categoryStats: readonly DictionaryCategoryStat[]
  entries: readonly LocalizedTagDictionaryEntry[]
  t: TagTranslator
}

type TagDictionaryViewProps = {
  categoryStats: readonly DictionaryCategoryStat[]
  entries: readonly LocalizedTagDictionaryEntry[]
  totalEntryCount: number
  type?: TagDictionaryTypeKey
}

type TagTranslator = ReturnType<typeof useTranslations<'Tag'>>

const DICTIONARY_CATEGORY_TONE = [
  'border-rose-400/30 bg-rose-950/20 text-rose-200',
  'border-sky-400/30 bg-sky-950/20 text-sky-200',
  'border-emerald-400/30 bg-emerald-950/20 text-emerald-200',
  'border-amber-400/30 bg-amber-950/20 text-amber-200',
  'border-violet-400/30 bg-violet-950/20 text-violet-200',
  'border-cyan-400/30 bg-cyan-950/20 text-cyan-200',
]

export default function TagDictionary({ categoryStats, entries, totalEntryCount, type }: TagDictionaryViewProps) {
  const locale = useLocale()
  const t = useTranslations('Tag')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const activeType = type ?? categoryStats[0]!.category

  const filteredEntries = entries.filter((entry) => {
    if (!deferredQuery) return true

    return getDictionarySearchText(entry, t).includes(deferredQuery)
  })

  return (
    <section className="mx-auto flex w-full h-full max-w-6xl flex-col gap-5">
      <div className="grid gap-3 rounded-lg bg-zinc-950/50 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="relative block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
          />
          <input
            className="h-11 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-10 pr-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('dictionary.searchPlaceholder')}
            type="search"
            value={query}
          />
        </label>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="tabular-nums">
            {t('dictionary.resultCount', {
              count: formatNumber(filteredEntries.length, locale),
              total: formatNumber(totalEntryCount, locale),
            })}
          </span>
        </div>
      </div>

      <nav
        aria-label={t('dictionary.views.label')}
        className="grid grid-cols-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60 p-1 sm:flex sm:w-fit"
      >
        <Link
          aria-current={type ? undefined : 'page'}
          className="rounded-md px-3 py-1 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100 aria-current:bg-zinc-800 aria-current:text-zinc-100"
          href="/tag/dictionary"
          prefetch={false}
        >
          {t('dictionary.views.alpha')}
        </Link>
        <Link
          aria-current={type ? 'page' : undefined}
          className="rounded-md px-3 py-1 text-center text-sm font-medium text-zinc-400 transition hover:text-zinc-100 aria-current:bg-zinc-800 aria-current:text-zinc-100"
          href={`/tag/dictionary/${activeType}`}
          prefetch={false}
        >
          {t('dictionary.views.category')}
        </Link>
      </nav>

      {type && (
        <nav aria-label={t('dictionary.categories.label')} className="flex flex-wrap gap-2">
          {categoryStats.map(({ category, count }) => (
            <Link
              aria-current={category === type ? 'page' : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 aria-current:border-zinc-500 aria-current:text-zinc-100"
              href={`/tag/dictionary/${category}`}
              key={category}
              prefetch={false}
            >
              <span>{t(`dictionary.typeLabels.${category}`)}</span>
              <span className="tabular-nums text-xs opacity-60">{formatNumber(count, locale)}</span>
            </Link>
          ))}
        </nav>
      )}

      {filteredEntries.length === 0 ? (
        <div className="flex items-center justify-center flex-1 rounded-lg border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
          {t('dictionary.empty')}
        </div>
      ) : type ? (
        <DictionaryEntryGrid categoryStats={categoryStats} entries={filteredEntries} t={t} />
      ) : (
        <div className="flex flex-col gap-8">
          {getAlphabetSections(filteredEntries).map(([letter, sectionEntries]) => (
            <section className="grid gap-3" key={letter}>
              <h2 className="text-sm font-semibold text-zinc-500">{letter}</h2>
              <DictionaryEntryGrid categoryStats={categoryStats} entries={sectionEntries} t={t} />
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

function DictionaryEntryGrid({ categoryStats, entries, t }: DictionaryEntryGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.name}>
          <article className="flex h-full flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-zinc-700">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="wrap-break-word text-base font-semibold text-zinc-100">{entry.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{getDictionaryTypeText(entry, t)}</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-xs ${getDictionaryTone(entry, categoryStats)}`}>
                {t(`dictionary.typeLabels.${entry.tagTypes[0]}`)}
              </span>
            </div>

            <p className="text-sm leading-6 text-zinc-300">{entry.description}</p>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {TAG_CATEGORY_PARAMS.map((category) => (
                <Link
                  className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                  href={`/search?query=${encodeURIComponent(`${category}:${normalizeValue(entry.name)}`)}`}
                  key={category}
                  prefetch={false}
                >
                  {t(`categories.${category}`)}
                </Link>
              ))}
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

function getAlphabetSections(entries: readonly LocalizedTagDictionaryEntry[]) {
  const groups = new Map<string, LocalizedTagDictionaryEntry[]>()

  for (const entry of entries) {
    const firstLetter = entry.name[0]?.toUpperCase() ?? '#'
    const key = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#'
    const group = groups.get(key)

    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }

  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })
}

function getDictionarySearchText(entry: LocalizedTagDictionaryEntry, t: TagTranslator) {
  return `${entry.name} ${entry.description} ${getDictionaryTypeText(entry, t)}`.toLowerCase()
}

function getDictionaryTone(entry: LocalizedTagDictionaryEntry, categoryStats: readonly DictionaryCategoryStat[]) {
  const category = entry.tagTypes[0]
  const index = categoryStats.findIndex((item) => item.category === category)
  return DICTIONARY_CATEGORY_TONE[index % DICTIONARY_CATEGORY_TONE.length]
}

function getDictionaryTypeText(entry: LocalizedTagDictionaryEntry, t: TagTranslator) {
  return entry.tagTypes.map((typeKey) => t(`dictionary.typeLabels.${typeKey}`)).join(' / ')
}
