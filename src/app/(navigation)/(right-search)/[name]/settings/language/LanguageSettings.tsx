'use client'

import * as Flags from 'country-flag-icons/react/3x2'
import Cookies from 'js-cookie'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

const LANGUAGES = [
  { code: 'ko', label: '한국어', flagCode: 'KR' },
  { code: 'en', label: 'English', flagCode: 'US' },
  { code: 'ja', label: '日本語', flagCode: 'JP' },
  { code: 'zh-CN', label: '简体中文', flagCode: 'CN' },
  { code: 'zh-TW', label: '繁體中文', flagCode: 'TW' },
] as const

type LanguageCode = (typeof LANGUAGES)[number]['code']

export default function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>()

  function handleLanguageChange(language: LanguageCode) {
    setSelectedLanguage(language)
    Cookies.set('locale', language, { expires: 365, path: '/' })
  }

  // NOTE: 쿠키에서 언어 설정을 불러옴
  useEffect(() => {
    const savedLanguage = Cookies.get('locale') as LanguageCode
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage)
    }
  }, [])

  return (
    <div className="grid gap-2">
      {LANGUAGES.map((language) => {
        const FlagComponent = Flags[language.flagCode]
        const isSelected = selectedLanguage === language.code

        return (
          <button
            aria-pressed={isSelected}
            className="flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30
            aria-pressed:border-brand-end aria-pressed:bg-zinc-800/50"
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            type="button"
          >
            <FlagComponent className="w-8 h-6 rounded-sm flex-shrink-0" />
            <span className="flex-1 font-medium">{language.label}</span>
            {isSelected && <Check className="size-5 text-brand-end flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
