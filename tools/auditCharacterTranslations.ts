#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'

interface CharacterTranslation {
  en: string
  ja?: string
  ko?: string
  'zh-CN'?: string
  'zh-TW'?: string
}

type CharacterTranslationDict = Record<string, CharacterTranslation>

function hasBrackets(value: string): boolean {
  return /[[\]〔〕【】]/.test(value)
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value)
}

function hasJapanese(value: string): boolean {
  // Hiragana / Katakana / Kanji / Halfwidth-Katakana
  return /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9d]/.test(value)
}

function hasLatin(value: string): boolean {
  return /[A-Za-z]/.test(value)
}

function hasLatinButOnlyInitials(value: string): boolean {
  const matches = value.match(/[A-Za-z]+/g)
  if (!matches) return false

  return matches.every((m) => m.length <= 2 && m.toLowerCase() !== 'no')
}

function isBlank(value: string | undefined): boolean {
  return !value || value.trim() === ''
}

function isKatakanaOnly(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  return /^[ァ-ヶー・]+$/.test(v)
}

function looksLikeCodeOrModel(value: string): boolean {
  const v = value.trim()
  if (!v) return false

  // pure numeric / dots / hyphens / slashes
  if (/^[0-9][0-9./-]*$/.test(v)) return true

  // common alnum model patterns: "AK-12", "AN-94", "A-91", "9A-91", "2B"
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(v)) return true

  // uppercase model tokens with spaces (e.g., "ST AR-15", "M4 SOPMOD II")
  if (/^[A-Z0-9\s./-]+$/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)) return true

  // dotted initialisms: "C.C.", "S.A.T.8", etc.
  if (/^([A-Za-z0-9]\.){2,}[A-Za-z0-9]*\.?$/.test(v)) return true

  // short alnum models like "Kar98k", "Px4"
  if (/^[A-Za-z]{1,4}[0-9]{1,4}[A-Za-z]?$/.test(v)) return true

  // patterns like "IWS 2000"
  if (/^[A-Za-z]{2,6}\s+[0-9]{1,4}$/.test(v)) return true

  // patterns like "Windows NT"
  if (/^[A-Za-z]{2,12}\s+[A-Z]{2,6}$/.test(v)) return true

  return false
}

function main() {
  const { outPath, noWrite, includeJa, limit } = parseArgs(process.argv.slice(2))

  const translationPath = path.join(process.cwd(), 'src', 'translation', 'character.json')
  const raw = fs.readFileSync(translationPath, 'utf-8')
  const dict = JSON.parse(raw) as CharacterTranslationDict

  const total = Object.keys(dict).length
  const missingKoEntries = Object.entries(dict)
    .filter(([, t]) => isBlank(t.ko))
    .map(([key, t]) => ({ key, en: t.en }))

  const suspiciousKoEntries = Object.entries(dict)
    .map(([key, t]) => ({ key, en: t.en, ko: (t.ko ?? '').trim() }))
    .filter((e) => !isBlank(e.ko))
    .filter((e) => !looksLikeCodeOrModel(e.en) && !looksLikeCodeOrModel(e.ko))
    .flatMap((e) => {
      const reasons: string[] = []
      if (e.ko.trim().toLowerCase() === e.en.trim().toLowerCase() && hasLatin(e.en)) {
        reasons.push('ko_equals_en')
      }
      if (!hasHangul(e.ko) && hasLatin(e.en)) {
        reasons.push('ko_no_hangul')
      }
      if (hasLatin(e.ko) && hasHangul(e.ko) && !hasLatinButOnlyInitials(e.ko)) {
        reasons.push('ko_mixed_hangul_latin')
      }
      if (hasBrackets(e.ko)) {
        reasons.push('ko_has_brackets')
      }

      return reasons.map((reason) => ({ ...e, reason }))
    })

  const suspiciousJaEntries = (() => {
    if (!includeJa) return []

    return Object.entries(dict)
      .map(([key, t]) => ({ key, en: t.en, ja: (t.ja ?? '').trim() }))
      .filter((e) => !isBlank(e.ja))
      .filter((e) => !looksLikeCodeOrModel(e.en) && !looksLikeCodeOrModel(e.ja))
      .flatMap((e) => {
        const reasons: string[] = []

        // ja 값에 한글이 들어가면 거의 확실히 오염
        if (hasHangul(e.ja)) {
          reasons.push('ja_has_hangul')
        }

        // 영어 이름과 동일한 ja(모델/코드 제외)는 강하게 의심
        if (e.ja.trim().toLowerCase() === e.en.trim().toLowerCase() && hasLatin(e.en)) {
          reasons.push('ja_equals_en')
        }

        // 일본어 문자(가나/한자)가 전혀 없는데, 영어 키 기반이면 의심
        if (!hasJapanese(e.ja) && hasLatin(e.en) && !hasLatinButOnlyInitials(e.ja)) {
          reasons.push('ja_no_japanese')
        }

        return reasons.map((reason) => ({ ...e, reason }))
      })
  })()

  const untrimmedKoEntries = Object.entries(dict)
    .filter(([, t]) => typeof t.ko === 'string' && t.ko.trim() !== t.ko)
    .map(([key, t]) => ({ key, en: t.en, ko: t.ko ?? '' }))

  const duplicateKoEntries = (() => {
    const map = new Map<string, { ko: string; items: { key: string; en: string }[] }>()
    for (const [key, t] of Object.entries(dict)) {
      const ko = (t.ko ?? '').trim()
      if (isBlank(ko)) continue
      const existing = map.get(ko)
      if (existing) {
        existing.items.push({ key, en: t.en })
        continue
      }
      map.set(ko, { ko, items: [{ key, en: t.en }] })
    }

    return [...map.values()]
      .filter((e) => e.items.length > 1)
      .sort((a, b) => b.items.length - a.items.length || a.ko.localeCompare(b.ko))
  })()

  const duplicateJaEntries = (() => {
    if (!includeJa) return []

    const map = new Map<string, { ja: string; items: { key: string; en: string }[] }>()
    for (const [key, t] of Object.entries(dict)) {
      const ja = (t.ja ?? '').trim()
      if (isBlank(ja)) continue
      if (!isKatakanaOnly(ja)) continue

      const existing = map.get(ja)
      if (existing) {
        existing.items.push({ key, en: t.en })
        continue
      }
      map.set(ja, { ja, items: [{ key, en: t.en }] })
    }

    return [...map.values()]
      .filter((e) => e.items.length > 1)
      .sort((a, b) => b.items.length - a.items.length || a.ja.localeCompare(b.ja))
  })()

  console.log(`Total entries: ${total}`)
  console.log(`Missing Korean (ko) translations: ${missingKoEntries.length}`)
  console.log(`Suspicious Korean (ko) translations: ${suspiciousKoEntries.length}`)
  if (includeJa) {
    console.log(`Suspicious Japanese (ja) translations: ${suspiciousJaEntries.length}`)
    console.log(`Duplicate Japanese (ja) translations (katakana-only): ${duplicateJaEntries.length}`)
  }
  console.log(`Untrimmed Korean (ko) translations: ${untrimmedKoEntries.length}`)
  console.log(`Duplicate Korean (ko) translations: ${duplicateKoEntries.length}`)

  console.log(`\nFirst ${limit} entries missing ko:`)
  missingKoEntries.slice(0, limit).forEach((e) => {
    console.log(`- ${e.key}: "${e.en}"`)
  })

  console.log(`\nFirst ${limit} suspicious ko entries:`)
  suspiciousKoEntries.slice(0, limit).forEach((e) => {
    console.log(`- ${e.key}: "${e.en}" -> "${e.ko}" (${e.reason})`)
  })

  if (includeJa) {
    console.log(`\nFirst ${limit} suspicious ja entries:`)
    suspiciousJaEntries.slice(0, limit).forEach((e) => {
      console.log(`- ${e.key}: "${e.en}" -> "${e.ja}" (${e.reason})`)
    })
  }

  if (untrimmedKoEntries.length > 0) {
    console.log(`\nFirst ${Math.min(limit, untrimmedKoEntries.length)} entries with untrimmed ko:`)
    untrimmedKoEntries.slice(0, limit).forEach((e) => {
      console.log(`- ${e.key}: "${e.en}" (ko: "${e.ko}")`)
    })
  }

  if (duplicateKoEntries.length > 0) {
    console.log(`\nFirst ${Math.min(limit, duplicateKoEntries.length)} duplicate ko values:`)
    duplicateKoEntries.slice(0, limit).forEach((e) => {
      console.log(`- "${e.ko}" (${e.items.length} keys): ${e.items.map((i) => i.key).join(', ')}`)
    })
  }

  if (includeJa && duplicateJaEntries.length > 0) {
    console.log(`\nFirst ${Math.min(limit, duplicateJaEntries.length)} duplicate ja values (katakana-only):`)
    duplicateJaEntries.slice(0, limit).forEach((e) => {
      console.log(`- "${e.ja}" (${e.items.length} keys): ${e.items.map((i) => i.key).join(', ')}`)
    })
  }

  if (!noWrite) {
    const payload = {
      missingKoEntries,
      suspiciousKoEntries,
      suspiciousJaEntries,
      untrimmedKoEntries,
      duplicateKoEntries,
      duplicateJaEntries,
    }

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log(`\nSaved audit report to ${outPath}`)
  }
}

function parseArgs(args: string[]) {
  const outIndex = args.indexOf('--out')
  const outPath = outIndex >= 0 ? args[outIndex + 1] : 'missing-character-ko.json'

  const noWrite = args.includes('--no-write')
  const includeJa = args.includes('--include-ja')

  const limitIndex = args.indexOf('--limit')
  const limitRaw = limitIndex >= 0 ? args[limitIndex + 1] : undefined
  const limit = limitRaw ? Number(limitRaw) : 30

  if (Number.isNaN(limit) || limit < 0) {
    throw new Error(`--limit 값이 올바르지 않아요: ${limitRaw}`)
  }

  if (outIndex >= 0 && (!outPath || outPath.startsWith('--'))) {
    throw new Error('--out 다음에 파일 경로가 필요해요')
  }

  return { outPath, noWrite, includeJa, limit }
}

main()
