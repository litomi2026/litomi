import { CensorshipKey } from '@litomi/domain/censorship/model'

import { CENSORSHIP_CATEGORIES, DEFAULT_CENSORSHIP_VALUES } from './constants'

export type DefaultCensorshipValue = (typeof DEFAULT_CENSORSHIP_VALUES)[number]

export function getDefaultCensorshipInputValue(item: DefaultCensorshipValue) {
  if (item.key === CensorshipKey.TAG) {
    return item.value
  }

  const category = CENSORSHIP_CATEGORIES.find(({ key }) => key === item.key)
  return category ? `${category.prefix}${item.value}` : item.value
}
