import 'server-only'

import categoryJSON from './category.json'
import { Multilingual } from './common'

const CATEGORY_TRANSLATION: Record<string, Multilingual | undefined> = categoryJSON

export function translateCategory(category: string, locale: keyof Multilingual): string {
  const translation = CATEGORY_TRANSLATION[category]
  return translation?.[locale] ?? translation?.en ?? category
}
