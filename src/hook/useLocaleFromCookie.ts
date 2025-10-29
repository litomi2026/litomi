import Cookies from 'js-cookie'
import { useRef } from 'react'

import { CookieKey } from '@/constants/storage'

export default function useLocaleFromCookie() {
  const locale = useRef(Cookies.get(CookieKey.LOCALE) ?? '')
  return locale.current
}
