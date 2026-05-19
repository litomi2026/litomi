'use client'

import { CookieKey } from '@litomi/domain/constants/storage'
import { Locale } from '@litomi/domain/locale'
import Cookies from 'js-cookie'

export function getLocaleFromCookie(): '' | Locale {
  return parseLocale(Cookies.get(CookieKey.LOCALE))
}

function parseLocale(locale: string | undefined): '' | Locale {
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
      return ''
  }
}
