import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

type Locale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'

export default function useLocaleFromCookie() {
  const [locale, setLocale] = useState<Locale>('ko')

  useEffect(() => {
    setLocale((Cookies.get('locale') || 'ko') as Locale)
  }, [])

  return locale
}
