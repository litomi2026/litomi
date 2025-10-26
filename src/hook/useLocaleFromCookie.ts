import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

import { CookieKey } from '@/constants/storage'

export default function useLocaleFromCookie() {
  const [locale, setLocale] = useState('')

  useEffect(() => {
    setLocale(Cookies.get(CookieKey.LOCALE) ?? '')
  }, [])

  return locale
}
