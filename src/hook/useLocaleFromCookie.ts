import Cookies from 'js-cookie'
import { useRef } from 'react'

import { CookieKey } from '@/constants/storage'
import { Locale } from '@/translation/common'

export default function useLocaleFromCookie() {
  const locale = useRef(parseLocale(Cookies.get(CookieKey.LOCALE)))
  return locale.current
}

function parseLocale(locale: string | undefined): Locale {
  switch (locale) {
    case Locale.EN:
      return Locale.EN
    case Locale.JA:
      return Locale.JA
    case Locale.KO:
      return Locale.KO
    case Locale.ZH_CN:
      return Locale.ZH_CN
    case Locale.ZH_TW:
      return Locale.ZH_TW
    default:
      return Locale.KO
  }
}
