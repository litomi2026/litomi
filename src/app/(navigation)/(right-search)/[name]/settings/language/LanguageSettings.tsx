'use client'

import { CN, JP, KR, TW, US } from 'country-flag-icons/react/3x2'
import Cookies from 'js-cookie'
import { Check, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CookieKey } from '@/constants/storage'

const LANGUAGES = [
  { code: '', label: '모두 보기', Flag: Globe },
  { code: 'ko', label: '한국어', Flag: KR },
  { code: 'en', label: 'English', Flag: US },
  { code: 'ja', label: '日本語', Flag: JP },
  { code: 'zh-CN', label: '简体中文', Flag: CN },
  { code: 'zh-TW', label: '繁體中文', Flag: TW },
] as const

type LanguageCode = (typeof LANGUAGES)[number]['code']

export default function LanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState('')

  function handleLanguageChange(language: LanguageCode) {
    if (language === '') {
      Cookies.remove(CookieKey.LOCALE)
      setSelectedLanguage('')
    } else {
      Cookies.set(CookieKey.LOCALE, language, { expires: 365 })
      setSelectedLanguage(language)
    }
  }

  // NOTE: 쿠키에서 언어 설정을 불러옴
  useEffect(() => {
    const savedLanguage = Cookies.get(CookieKey.LOCALE)
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage)
    }
  }, [])

  return (
    <div className="grid gap-2">
      {LANGUAGES.map(({ code, label, Flag }) => {
        const isSelected = selectedLanguage === code

        return (
          <button
            aria-pressed={isSelected}
            className="flex items-center gap-4 p-4 rounded-lg border-2 transition text-left border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30
            aria-pressed:border-brand-end aria-pressed:bg-zinc-800/50"
            key={code}
            onClick={() => handleLanguageChange(code)}
            type="button"
          >
            <Flag className="size-6 rounded-sm flex-shrink-0" />
            <span className="flex-1 font-medium">{label}</span>
            {isSelected && <Check className="size-5 text-brand-end flex-shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
