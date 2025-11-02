'use client'

import { CN, DE, ES, FR, HU, IT, JP, KR, NL, PT, RU, TH, US, VN } from 'country-flag-icons/react/3x2'
import { Globe, Meh, Pencil } from 'lucide-react'
import Link, { useLinkStatus } from 'next/link'
import { ReactNode } from 'react'

import IconSpinner from '../icons/IconSpinner'
import { useSearchFilter } from './useSearchFilter'

type Props = {
  language: string
  className?: string
}

// Language to emoji flag mapping
const LANGUAGE_FLAGS: Record<string, ReactNode> = {
  korean: <KR title="Korea" />,
  japanese: <JP title="Japan" />,
  english: <US title="United States" />,
  chinese: <CN title="China" />,
  spanish: <ES title="Spain" />,
  hungarian: <HU title="Hungary" />,
  french: <FR title="France" />,
  german: <DE title="Germany" />,
  dutch: <NL title="Netherlands" />,
  italian: <IT title="Italy" />,
  portuguese: <PT title="Portugal" />,
  russian: <RU title="Russia" />,
  thai: <TH title="Thailand" />,
  vietnamese: <VN title="Vietnam" />,
  speechless: <Meh />,
  rewrite: <Pencil />,
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

export default function MangaLanguageLink({ language, className = '' }: Readonly<Props>) {
  const { href, isActive } = useSearchFilter(`language:${language}`)

  return (
    <Link
      aria-current={isActive}
      aria-label={`Filter by ${language}`}
      className={`group relative px-1.5 py-0.5 text-xs font-medium rounded-md bg-zinc-700 transition aria-current:ring-2 aria-current:ring-brand-end aria-current:bg-zinc-700 ${className}`}
      href={href}
      prefetch={false}
      title={`${language} 작품 보기`}
    >
      <LanguageBadgeContent language={language} />
    </Link>
  )
}

function LanguageBadgeContent({ language }: { language: string }) {
  const { pending } = useLinkStatus()
  const flag = LANGUAGE_FLAGS[language.toLowerCase()] || <Globe className="text-brand-start" />
  const code = LANGUAGE_CODES[language.toLowerCase()] || language.toUpperCase().slice(0, 2)

  return (
    <>
      <IconSpinner
        aria-hidden={!pending}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition aria-hidden:opacity-0 text-foreground p-0.5 w-5 h-5"
      />
      <span aria-hidden={pending} className="flex items-center gap-1 aria-hidden:opacity-0 transition">
        <span className="text-base leading-none [&>svg]:size-[1em]">{flag}</span>
        <span className="text-xs font-mono uppercase group-hover:underline group-focus:underline">{code}</span>
      </span>
    </>
  )
}
