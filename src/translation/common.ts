export type Multilingual = {
  en: string
  ko?: string
  ja?: string
  'zh-CN'?: string
  'zh-TW'?: string
}

export function normalizeValue(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

export function translateValue(dict: Record<string, Multilingual>, name: string, locale: keyof Multilingual): string {
  const normalizedName = normalizeValue(name)
  const translation = dict[normalizedName]

  if (!translation) {
    return name.replace(/_/g, ' ')
  }

  return translation[locale] || translation.en || name.replace(/_/g, ' ')
}
