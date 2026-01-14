#!/usr/bin/env bun

import fs from 'fs'
import ms from 'ms'
import path from 'path'
import { z } from 'zod'

const filesURL = 'https://api.github.com/repos/tom5079/Pupil/git/trees/tags'
const contentURL = 'https://raw.githubusercontent.com/tom5079/Pupil/tags/'

type SupportedLocale = 'en' | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'
const SupportedLocales: ReadonlySet<SupportedLocale> = new Set(['en', 'ja', 'ko', 'zh-CN', 'zh-TW'])

const AllowedTargetFiles = [
  'src/translation/tag-category.json',
  'src/translation/tag-mixed.json',
  'src/translation/tag-other.json',
  'src/translation/tag-single-sex.json',
  'src/translation/tag-unisex.json',
] as const

type AllowedTargetFile = (typeof AllowedTargetFiles)[number]

type PupilLocaleCode = string
type PupilTranslationMap = Record<string, string>

type TranslationEntry = {
  en: unknown
  ko?: unknown
  ja?: unknown
  'zh-CN'?: unknown
  'zh-TW'?: unknown
}

const ArgsSchema = z.object({
  translationDir: z.string().default('src/translation'),
  files: z.string().optional(), // comma-separated, relative to repo root (must be within allowlist)
  write: z.boolean().default(false),
  timeoutMs: z.coerce.number().int().positive().default(ms('20s')),
  normalizeKeys: z.boolean().default(true),
  addMissingFields: z.boolean().default(true),
  locales: z.string().optional(), // comma-separated locale codes (e.g. ko,ja,zh)
  overwriteLocales: z.string().default('en,ja,zh-CN,zh-TW'), // comma-separated SupportedLocale(s)
})

type Args = z.infer<typeof ArgsSchema>

type GitHubTreeResponse = {
  tree?: Array<{ path?: string; type?: string }>
}

function computeInsertionIndent(jsonText: string, objectStart: number): string {
  // Uses the indentation of the line where the object starts as a baseline.
  const lineStart = jsonText.lastIndexOf('\n', objectStart)
  if (lineStart < 0) return '  '
  const afterNewline = jsonText.slice(lineStart + 1, objectStart)
  const m = afterNewline.match(/^\s*/)
  return (m?.[0] ?? '') + '  '
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const r = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return (await r.json()) as T
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return await r.text()
}

function findObjectRangeForKey(jsonText: string, key: string): { start: number; endExclusive: number } | null {
  // Find the first occurrence of "key": ... and then capture the object value {...}
  // This is a lightweight scanner that respects JSON strings and brace depth.
  const quotedKey = JSON.stringify(key) // includes quotes and escapes
  const needle = `${quotedKey}:`
  const idx = jsonText.indexOf(needle)
  if (idx < 0) return null

  let i = idx + needle.length
  while (i < jsonText.length && /\s/.test(jsonText[i] ?? '')) i++
  if (jsonText[i] !== '{') return null

  const start = i
  let depth = 0
  let inString = false
  let escaped = false

  for (; i < jsonText.length; i++) {
    const ch = jsonText[i]!
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === '"') {
        inString = false
        continue
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') {
      depth++
      continue
    }
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return { start, endExclusive: i + 1 }
      }
      continue
    }
  }

  return null
}

async function getAvailablePupilLocales(args: Args): Promise<PupilLocaleCode[]> {
  if (args.locales) {
    return args.locales
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }

  const res = await fetchJson<GitHubTreeResponse>(filesURL, args.timeoutMs)
  const files =
    res.tree?.map((t) => t.path).filter((p): p is string => typeof p === 'string' && p.endsWith('.json')) ?? []

  return files.map((p) => p.replace(/\.json$/i, ''))
}

async function getPupilTranslations(args: Args, pupilLocale: PupilLocaleCode): Promise<PupilTranslationMap> {
  const url = `${contentURL}${encodeURIComponent(pupilLocale)}.json`
  const rawText = await fetchText(url, args.timeoutMs)
  const parsed = JSON.parse(rawText) as unknown
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`unexpected JSON shape for ${pupilLocale}.json`)
  }

  const out: PupilTranslationMap = {}
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v !== 'string') continue
    const cleaned = stripEmojis(v)
    if (isBlank(cleaned)) continue
    out[k] = cleaned
  }
  return out
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function isTranslationEntry(value: unknown): value is TranslationEntry {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return 'en' in value
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const targetFiles = resolveTargetFiles(args)
  if (targetFiles.length === 0) {
    console.error('No target JSON files found.')
    process.exitCode = 1
    return
  }

  const availableLocales = await getAvailablePupilLocales(args)
  const localePairs = availableLocales
    .map((p) => ({ pupil: p, supported: mapPupilLocaleToSupportedLocale(p) }))
    .filter((p): p is { pupil: string; supported: SupportedLocale } => p.supported !== null)

  if (localePairs.length === 0) {
    console.error('No supported locales found from Pupil.')
    process.exitCode = 1
    return
  }

  console.log(`Pupil locales: ${localePairs.map((p) => `${p.pupil}→${p.supported}`).join(', ')}`)
  console.log(`Targets: ${targetFiles.length} file(s)`)
  console.log(args.write ? 'Mode: write' : 'Mode: dry-run')

  const pupilMaps: Partial<Record<SupportedLocale, PupilTranslationMap>> = {}
  for (const { pupil, supported } of localePairs) {
    pupilMaps[supported] = await getPupilTranslations(args, pupil)
  }

  const overwriteLocales = new Set(
    args.overwriteLocales
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is SupportedLocale => SupportedLocales.has(s as SupportedLocale)),
  )

  let totalChangedFiles = 0
  let totalChangedFields = 0

  for (const filePath of targetFiles) {
    const originalText = fs.readFileSync(filePath, 'utf-8')
    let parsed: unknown
    try {
      parsed = JSON.parse(originalText) as unknown
    } catch (_e) {
      console.warn(`Skip (invalid JSON): ${path.relative(process.cwd(), filePath)}`)
      continue
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn(`Skip (unexpected JSON shape): ${path.relative(process.cwd(), filePath)}`)
      continue
    }

    const dict = parsed as Record<string, unknown>
    const dictSorted = stableSortKeys(dict)

    let nextText = originalText
    let changedFields = 0
    let changedKeys = 0

    // Apply patches per key, per locale. We patch the text (not re-serialize) to keep formatting stable.
    for (const [key, value] of Object.entries(dictSorted)) {
      if (!isTranslationEntry(value)) continue

      let changedThisKey = false
      for (const locale of SupportedLocales) {
        const pupilMap = pupilMaps[locale]
        if (!pupilMap) continue

        const current = pickCurrentLocaleValue(value, locale)
        const shouldOverwrite = overwriteLocales.has(locale)
        if (!shouldOverwrite && current !== null && !isBlank(current)) continue

        const candidates = args.normalizeKeys ? [key, normalizeKey(key)] : [key]
        let newValue: string | null = null
        for (const c of candidates) {
          const v = pupilMap[c]
          if (typeof v === 'string' && !isBlank(v)) {
            newValue = v
            break
          }
        }
        if (!newValue) continue

        // Only patch if the object exists in the text for this key.
        const range = findObjectRangeForKey(nextText, key)
        if (!range) continue

        const objectText = nextText.slice(range.start, range.endExclusive)
        const indent = computeInsertionIndent(nextText, range.start)
        const { changed, nextObjectText } = patchLocaleValueInObjectText(
          objectText,
          locale,
          newValue,
          args.addMissingFields,
          shouldOverwrite,
          indent,
        )
        if (!changed) continue

        nextText = nextText.slice(0, range.start) + nextObjectText + nextText.slice(range.endExclusive)
        changedFields++
        changedThisKey = true
        totalChangedFields++
      }

      if (changedThisKey) changedKeys++
    }

    if (changedFields > 0) {
      totalChangedFiles++
      console.log(
        `- ${path.relative(process.cwd(), filePath)}: updated ${changedFields} field(s) across ${changedKeys} key(s)`,
      )
      if (args.write) {
        fs.writeFileSync(filePath, nextText, 'utf-8')
      }
    }
  }

  console.log(`Done. Changed files: ${totalChangedFiles}, changed fields: ${totalChangedFields}`)
  if (!args.write) {
    console.log('Run with --write to apply changes.')
  }
}

function mapPupilLocaleToSupportedLocale(code: PupilLocaleCode): SupportedLocale | null {
  const c = code.trim()
  const lower = c.toLowerCase()
  if (SupportedLocales.has(c as SupportedLocale)) return c as SupportedLocale
  if (lower === 'kr' || lower === 'ko') return 'ko'
  if (lower === 'jp' || lower === 'ja') return 'ja'
  if (lower === 'zh' || lower === 'zh-cn' || lower === 'zh_hans') return 'zh-CN'
  if (lower === 'zh-tw' || lower === 'zh_hant') return 'zh-TW'
  if (lower === 'en') return 'en'
  return null
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, unknown> = {}
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i]
    if (!v?.startsWith('--')) continue
    const key = v.slice(2)

    // boolean flags
    if (key === 'write') raw.write = true
    else if (key === 'no-normalize-keys') raw.normalizeKeys = false
    else if (key === 'add-missing-fields') raw.addMissingFields = true
    else {
      const next = argv[i + 1]
      if (typeof next === 'string' && !next.startsWith('--')) {
        raw[key] = next
        i++
      } else {
        raw[key] = true
      }
    }
  }

  const normalized: Record<string, unknown> = { ...raw }
  // aliases
  if (typeof raw['dir'] === 'string' && !raw['translationDir']) normalized.translationDir = raw['dir']
  if (typeof raw['timeout'] === 'string' && raw['timeoutMs'] === undefined) {
    const n = Number(raw['timeout'])
    if (Number.isFinite(n)) normalized.timeoutMs = n
  }

  return ArgsSchema.parse(normalized)
}

function patchLocaleValueInObjectText(
  objectText: string,
  locale: SupportedLocale,
  newValue: string,
  addMissingFields: boolean,
  overwrite: boolean,
  outerIndent: string,
): { changed: boolean; nextObjectText: string } {
  const localeKey = JSON.stringify(locale)

  // 1) If field exists as a string -> update when overwriting, or when empty.
  {
    const idx = objectText.indexOf(`${localeKey}:`)
    if (idx >= 0) {
      let i = idx + `${localeKey}:`.length
      while (i < objectText.length && /\s/.test(objectText[i] ?? '')) i++

      if (objectText[i] === '"') {
        // parse JSON string to find end
        const startQuote = i
        i++
        let escaped = false
        for (; i < objectText.length; i++) {
          const ch = objectText[i]!
          if (escaped) {
            escaped = false
            continue
          }
          if (ch === '\\') {
            escaped = true
            continue
          }
          if (ch === '"') break
        }

        const endQuote = i
        if (endQuote < objectText.length && objectText[endQuote] === '"') {
          const currentJsonString = objectText.slice(startQuote, endQuote + 1)
          let currentValue: string | null = null
          try {
            currentValue = JSON.parse(currentJsonString) as string
          } catch {
            currentValue = null
          }

          const shouldReplace = overwrite || (typeof currentValue === 'string' && isBlank(currentValue))
          if (!shouldReplace) return { changed: false, nextObjectText: objectText }

          const replacement = JSON.stringify(newValue)
          return {
            changed: true,
            nextObjectText: objectText.slice(0, startQuote) + replacement + objectText.slice(endQuote + 1),
          }
        }
      }

      // locale exists but is not a string (e.g. array); don't touch
      return { changed: false, nextObjectText: objectText }
    }
  }

  if (!addMissingFields) {
    return { changed: false, nextObjectText: objectText }
  }

  // 2) If field missing -> insert before final "}".
  // Avoid touching if locale already exists with non-string (e.g. array).
  if (objectText.includes(`${localeKey}:`)) {
    return { changed: false, nextObjectText: objectText }
  }

  const hasNewlines = objectText.includes('\n')
  const insert = hasNewlines
    ? `,\n${outerIndent}${localeKey}: ${JSON.stringify(newValue)}`
    : `, ${localeKey}: ${JSON.stringify(newValue)}`

  const lastBrace = objectText.lastIndexOf('}')
  if (lastBrace < 0) return { changed: false, nextObjectText: objectText }
  return {
    changed: true,
    nextObjectText: objectText.slice(0, lastBrace) + insert + objectText.slice(lastBrace),
  }
}

function pickCurrentLocaleValue(entry: TranslationEntry, locale: SupportedLocale): string | null {
  const v = entry[locale]
  if (typeof v === 'string') return v
  return null
}

function resolveTargetFiles(args: Args): string[] {
  const requested = (
    args.files
      ? args.files
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [...AllowedTargetFiles]
  ) as string[]

  const unknown = requested.filter((p) => !AllowedTargetFiles.includes(p as AllowedTargetFile))
  if (unknown.length > 0) {
    throw new Error(`Unsupported target file(s): ${unknown.join(', ')}\nAllowed: ${AllowedTargetFiles.join(', ')}`)
  }

  return requested.map((p) => path.join(process.cwd(), p))
}

function stableSortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  // only used for parsing/iteration order in reports; does NOT rewrite files
  const entries = Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return Object.fromEntries(entries)
}

function stripEmojis(value: string): string {
  // Remove emoji / pictographs (including ZWJ sequences + variation selectors).
  // Bun supports Unicode property escapes.
  const withoutEmoji = value
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{Emoji_Component}/gu, '')
    .replace(/\u200D/gu, '') // zero-width joiner
    .replace(/\uFE0E|\uFE0F/gu, '') // variation selectors

  return withoutEmoji.replace(/\s+/g, ' ').trim()
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
