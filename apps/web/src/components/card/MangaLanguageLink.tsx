import { CN, DE, ES, FR, HU, IT, JP, KR, NL, PT, RU, TH, US, VN } from 'country-flag-icons/react/3x2'
import { Globe, Meh, Pencil } from 'lucide-react'
import { ReactNode } from 'react'

import { Link } from '@/i18n/navigation'

import { getSearchFilter } from './searchFilter'

type Props = {
  className?: string
  language: string
  searchParams?: string
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

export default function MangaLanguageLink({ className = '', language, searchParams }: Props) {
  const { href, isActive } = getSearchFilter(`language:${language}`, searchParams)

  return (
    <Link
      aria-current={isActive}
      aria-label={`Filter by ${language}`}
      className={`group relative px-1.5 py-0.5 text-xs font-medium rounded-md bg-zinc-700 transition aria-current:ring-2 aria-current:ring-brand aria-current:bg-zinc-700 ${className}`}
      href={href}
      prefetch={false}
      title={`${language} 작품 보기`}
    >
      <LanguageBadgeContent language={language} />
    </Link>
  )
}

function LanguageBadgeContent({ language }: { language: string }) {
  const flag = LANGUAGE_FLAGS[language.toLowerCase()] || <Globe className="text-brand-start" />
  const code = LANGUAGE_CODES[language.toLowerCase()] || language.toUpperCase().slice(0, 2)

  return (
    <span className="flex items-center gap-1 transition">
      <span className="text-base leading-none [&>svg]:size-[1em]">{flag}</span>
      <span className="text-xs font-mono uppercase group-hover:underline group-focus:underline">{code}</span>
    </span>
  )
}
