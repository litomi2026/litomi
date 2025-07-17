#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'

interface SeriesTranslation {
  en: string
  ja?: string
  ko?: string
}

const seriesPath = path.join(process.cwd(), 'src/translation/series.json')
const seriesData = JSON.parse(fs.readFileSync(seriesPath, 'utf-8')) as Record<string, SeriesTranslation>

// Count missing translations
let missingKo = 0
let missingJa = 0
let totalEntries = 0

const missingEntries: Array<{ key: string; en: string; missingKo: boolean; missingJa: boolean }> = []

Object.entries(seriesData).forEach(([key, translations]) => {
  totalEntries++
  const hasKo = translations.ko && translations.ko.trim() !== ''
  const hasJa = translations.ja && translations.ja.trim() !== ''

  if (!hasKo) missingKo++
  if (!hasJa) missingJa++

  if (!hasKo || !hasJa) {
    missingEntries.push({
      key,
      en: translations.en,
      missingKo: !hasKo,
      missingJa: !hasJa,
    })
  }
})

console.log(`Total entries: ${totalEntries}`)
console.log(`Missing Korean translations: ${missingKo}`)
console.log(`Missing Japanese translations: ${missingJa}`)
console.log('\nFirst 20 entries missing translations:')

missingEntries.slice(0, 20).forEach((entry) => {
  const missing = []
  if (entry.missingKo) missing.push('ko')
  if (entry.missingJa) missing.push('ja')
  console.log(`- ${entry.key}: "${entry.en}" (missing: ${missing.join(', ')})`)
})

// Export the list of missing entries for processing
fs.writeFileSync('missing-translations.json', JSON.stringify(missingEntries, null, 2))
console.log('\nFull list of missing translations saved to missing-translations.json')
