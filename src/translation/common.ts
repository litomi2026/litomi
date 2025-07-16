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
