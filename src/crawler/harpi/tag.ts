import harpiTagJSON from '@/crawler/harpi/tag.json'

type HarpiTag = {
  en: string
  ko?: string
}

export const HARPI_TAG_MAP: Record<string, HarpiTag> = harpiTagJSON

// const a = [{ ... }]
// Object.fromEntries(a.map(aa => [aa.id, { ko: aa.korStr, en: aa.engStr.replaceAll(' ', '_'),  }]))
