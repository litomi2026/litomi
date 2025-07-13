'use client'

import Link, { useLinkStatus } from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import IconSpinner from '../icons/IconSpinner'

type Props = {
  language: string
  className?: string
}

// Language to emoji flag mapping
const LANGUAGE_FLAGS: Record<string, string> = {
  korean: '🇰🇷',
  japanese: '🇯🇵',
  english: '🇬🇧',
  chinese: '🇨🇳',
  spanish: '🇪🇸',
  hungarian: '🇭🇺',
  french: '🇫🇷',
  german: '🇩🇪',
  dutch: '🇳🇱',
  italian: '🇮🇹',
  portuguese: '🇵🇹',
  russian: '🇷🇺',
  thai: '🇹🇭',
  vietnamese: '🇻🇳',
  speechless: '😶',
  rewrite: '✏️',
}

// Language to ISO 639-1 code mapping
const LANGUAGE_CODES: Record<string, string> = {
  korean: 'KO',
  japanese: 'JA',
  english: 'EN',
  chinese: 'ZH',
  spanish: 'ES',
  hungarian: 'HU',
  french: 'FR',
  german: 'DE',
  dutch: 'NL',
  italian: 'IT',
  portuguese: 'PT',
  russian: 'RU',
  thai: 'TH',
  vietnamese: 'VI',
  speechless: 'X',
  rewrite: 'R',
}

export default function LanguageBadge({ language, className = '' }: Readonly<Props>) {
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('query') ?? ''

  const { newQuery, isActive } = useMemo(() => {
    const normalizedLang = language.toLowerCase()

    const queryWithoutLanguage = currentQuery
      .split(/\s+/)
      .filter((term) => !term.startsWith('language:'))
      .join(' ')
      .trim()

    const isCurrentlyActive = new RegExp(`(^|\\s)language:${normalizedLang}(?=\\s|$)`, 'i').test(currentQuery)

    const newQueryValue = isCurrentlyActive
      ? queryWithoutLanguage
      : queryWithoutLanguage
        ? `${queryWithoutLanguage} language:${normalizedLang}`
        : `language:${normalizedLang}`

    return {
      newQuery: newQueryValue.trim(),
      isActive: isCurrentlyActive,
    }
  }, [language, currentQuery])

  const newSearchParams = new URLSearchParams(searchParams)

  if (newQuery) {
    newSearchParams.set('query', newQuery)
  } else {
    newSearchParams.delete('query')
  }

  return (
    <Link
      aria-label={`Filter by ${language}`}
      aria-pressed={isActive}
      className={`group relative px-1.5 py-0.5 text-xs font-medium rounded-md bg-zinc-700 transition aria-pressed:ring-2 aria-pressed:ring-brand-end aria-pressed:bg-zinc-700 ${className}`}
      href={`/search?${newSearchParams}`}
      title={`${language} 작품 보기`}
    >
      <LanguageBadgeContent language={language} />
    </Link>
  )
}

function LanguageBadgeContent({ language }: { language: string }) {
  const { pending } = useLinkStatus()
  const flag = LANGUAGE_FLAGS[language.toLowerCase()] || '🌐'
  const code = LANGUAGE_CODES[language.toLowerCase()] || language.toUpperCase().slice(0, 2)

  return (
    <>
      <IconSpinner
        aria-hidden={!pending}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition aria-hidden:opacity-0 text-foreground p-0.5 w-5 h-5"
      />
      <span aria-hidden={pending} className="flex items-center gap-0.5 aria-hidden:opacity-0 transition">
        <span className="text-base leading-none">{flag}</span>
        <span className="text-xs uppercase group-hover:underline group-focus:underline">{code}</span>
      </span>
    </>
  )
}
