export type Multilingual = {
  en: string
  ko?: string
  ja?: string
  'zh-CN'?: string
  'zh-TW'?: string
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}
