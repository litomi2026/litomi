import { PUBLIC_LOCALES, type PublicLocale } from '@litomi/domain/locale'

import { messages as rankingMessages } from '@/app/[locale]/(navigation)/(ranking)/messages'
import { messages as censorMessages } from '@/app/[locale]/(navigation)/(right-aside)/[name]/censor/messages'
import { messages as rightAsideMessages } from '@/app/[locale]/(navigation)/(right-aside)/messages'
import { messages as liboMessages } from '@/app/[locale]/(navigation)/(top-navigation)/libo/messages'
import { messages as topNavigationMessages } from '@/app/[locale]/(navigation)/(top-navigation)/messages'
import { messages as libraryMessages } from '@/app/[locale]/(navigation)/library/messages'
import { messages as navigationMessages } from '@/app/[locale]/(navigation)/messages'
import { messages as authMessages } from '@/app/[locale]/auth/messages'
import { messages as deterrenceMessages } from '@/app/[locale]/deterrence/messages'
import { messages as docMessages } from '@/app/[locale]/doc/messages'
import { messages as mangaMessages } from '@/app/[locale]/manga/[id]/messages'
import { messages as appMessages } from '@/app/[locale]/messages'

export type LocalizedMessages = Record<PublicLocale, Messages>
export type Messages = { [key: string]: MessageValue }
export type MessageValue = string | { [key: string]: MessageValue }

const messageModules = [
  appMessages,
  authMessages,
  deterrenceMessages,
  docMessages,
  navigationMessages,
  rankingMessages,
  rightAsideMessages,
  censorMessages,
  topNavigationMessages,
  liboMessages,
  libraryMessages,
  mangaMessages,
] satisfies LocalizedMessages[]

const mergedMessages = Object.fromEntries(
  PUBLIC_LOCALES.map((locale) => [locale, mergeLocaleMessages(locale)]),
) as LocalizedMessages

export function getMessages(locale: PublicLocale): Messages {
  return mergedMessages[locale]
}

function isMessages(value: MessageValue | undefined): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeLocaleMessages(locale: PublicLocale): Messages {
  return messageModules.reduce<Messages>((merged, moduleMessages) => {
    return mergeMessages(merged, moduleMessages[locale])
  }, {})
}

function mergeMessages(target: Messages, source: Messages): Messages {
  const merged: Messages = { ...target }

  for (const [key, value] of Object.entries(source)) {
    const existing = merged[key]
    merged[key] = isMessages(existing) && isMessages(value) ? mergeMessages(existing, value) : value
  }

  return merged
}
