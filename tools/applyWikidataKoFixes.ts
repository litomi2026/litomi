#!/usr/bin/env bun

import fs from 'fs'
import ms from 'ms'
import path from 'path'

interface CharacterTranslation {
  en: string
  ja?: string
  ko?: string
}

type CharacterTranslationDict = Record<string, CharacterTranslation>

type LocaleKey = 'en' | 'ja' | 'ko'

interface StatusFile {
  changedFields: number
  changedKeys: number
  checked?: number
  errorsCount: number
  lastChangedField: LocaleKey | null
  lastChangedFrom: string | null
  lastChangedKey: string | null
  lastChangedTo: string | null
  lastCheckedKey?: string | null
  lastError: string | null
  lastSource: string | null
  phase?: string
  startedAt: string
  targetKeysToChange: number
  updatedAt: string
}

interface WikidataGetEntitiesResponse {
  entities: Record<
    string,
    {
      labels?: Record<string, { value: string }>
    }
  >
}

interface WikidataSearchResponse {
  search: { id: string }[]
}

function buildWikidataApiUrl(params: Record<string, string>): string {
  const sp = new URLSearchParams({ ...params, format: 'json', origin: '*' })
  return `https://www.wikidata.org/w/api.php?${sp.toString()}`
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return (await r.json()) as T
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value)
}

function hasLatin(value: string): boolean {
  return /[A-Za-z]/.test(value)
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function looksLikeCodeOrModel(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^[0-9][0-9./-]*$/.test(v)) return true
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(v)) return true
  if (/^[A-Z0-9\s./-]+$/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)) return true
  if (/^([A-Za-z0-9]\.){2,}[A-Za-z0-9]*\.?$/.test(v)) return true
  if (/^[A-Za-z]{1,4}[0-9]{1,4}[A-Za-z]?$/.test(v)) return true
  return false
}

async function main() {
  const { writeEvery, statusPath } = parseArgs(process.argv.slice(2))

  const repoRoot = process.cwd()
  const translationPath = path.join(repoRoot, 'src', 'translation', 'character.json')
  const statusAbsPath = path.isAbsolute(statusPath) ? statusPath : path.join(repoRoot, statusPath)

  const dict = readJsonFile<CharacterTranslationDict>(translationPath)
  const status = readJsonFile<StatusFile>(statusAbsPath)

  const target = status.targetKeysToChange ?? 100
  const baseKeys = status.changedKeys ?? 0
  const baseFields = status.changedFields ?? 0
  const remaining = Math.max(0, target - baseKeys)

  status.phase = 'wikidata_ko'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const changedKeySet = new Set<string>()
  let addedFields = 0

  const TIMEOUT = ms('12s')

  function bumpChange(key: string, from: string, to: string) {
    changedKeySet.add(key)
    addedFields += 1

    status.changedKeys = baseKeys + changedKeySet.size
    status.changedFields = baseFields + addedFields
    status.lastChangedKey = key
    status.lastChangedField = 'ko'
    status.lastChangedFrom = from
    status.lastChangedTo = to
    status.lastSource = 'wikidata'
    status.updatedAt = nowIso()
  }

  function bumpChecked(key: string) {
    status.checked = (status.checked ?? 0) + 1
    status.lastCheckedKey = key
    status.updatedAt = nowIso()
  }

  function bumpError(err: unknown) {
    status.errorsCount = (status.errorsCount ?? 0) + 1
    status.lastError = String(err)
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  const candidates: string[] = []
  for (const [key, t] of Object.entries(dict)) {
    const en = String(t.en ?? '').trim()
    const ko = String(t.ko ?? '').trim()
    const ja = String(t.ja ?? '').trim()
    if (!en) continue
    if (!ja) continue
    if (!shouldConsiderKoFix(en, ko)) continue
    // Require Japanese to contain Japanese script to reduce false matches.
    if (!/[ぁ-んァ-ヶ一-龯々]/.test(ja)) continue
    candidates.push(key)
  }

  // deterministic order for reproducibility
  candidates.sort((a, b) => a.localeCompare(b))

  for (const key of candidates) {
    if (changedKeySet.size >= remaining) break

    const entry = dict[key]
    const en = String(entry.en ?? '').trim()
    const ja = String(entry.ja ?? '').trim()
    const ko = String(entry.ko ?? '').trim()

    bumpChecked(key)
    if ((status.checked ?? 0) % 25 === 0) {
      maybeFlush(true)
    }

    try {
      const ids = await wikidataSearchIds(en, TIMEOUT)
      if (ids.length === 0) continue

      const labelsById = await wikidataGetLabels(ids, TIMEOUT)
      const jaNorm = normalizeJa(ja)

      const matches: { id: string; ko: string }[] = []
      for (const id of ids) {
        const labels = labelsById.get(id)
        if (!labels) continue
        if ((labels.en ?? '').trim() !== en) continue

        const jaLabel = (labels.ja ?? '').trim()
        if (!jaLabel) continue
        if (normalizeJa(jaLabel) !== jaNorm) continue

        const koLabel = (labels.ko ?? '').trim()
        if (!koLabel) continue
        if (!hasHangul(koLabel)) continue

        matches.push({ id, ko: koLabel })
      }

      if (matches.length !== 1) continue

      const koOff = matches[0].ko
      if (koOff === ko) continue

      entry.ko = koOff
      bumpChange(key, ko, koOff)
      maybeFlush(false)
    } catch (e) {
      bumpError(e)
      maybeFlush(true)
      continue
    }
  }

  status.phase = status.changedKeys >= target ? 'done' : status.phase
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)
  writeJsonFile(translationPath, dict)

  console.log(
    JSON.stringify(
      {
        candidates: candidates.length,
        addedKeys: changedKeySet.size,
        addedFields,
        totalKeys: status.changedKeys,
        totalFields: status.changedFields,
        statusFile: path.relative(repoRoot, statusAbsPath),
      },
      null,
      2,
    ),
  )
}

function normalizeJa(value: string): string {
  return value
    .trim()
    .replaceAll('・', '')
    .replaceAll('＝', '')
    .replaceAll('＝', '=')
    .replaceAll('’', "'")
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll(' ', '')
    .replaceAll('　', '')
}

function nowIso(): string {
  return new Date().toISOString()
}

function parseArgs(args: string[]) {
  const writeEveryIndex = args.indexOf('--write-every')
  const writeEveryRaw = writeEveryIndex >= 0 ? args[writeEveryIndex + 1] : undefined
  const writeEvery = writeEveryRaw ? Number(writeEveryRaw) : 5
  if (!Number.isFinite(writeEvery) || writeEvery <= 0) {
    throw new Error(`--write-every 값이 올바르지 않아요: ${writeEveryRaw}`)
  }

  const statusIndex = args.indexOf('--status')
  const statusPath = statusIndex >= 0 ? args[statusIndex + 1] : 'tools/character-officialize-status.json'
  if (!statusPath || statusPath.startsWith('--')) {
    throw new Error('--status 다음에 파일 경로가 필요해요')
  }

  return { writeEvery, statusPath }
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function shouldConsiderKoFix(en: string, ko: string): boolean {
  const koTrim = ko.trim()
  const enTrim = en.trim()
  if (isBlank(koTrim)) return true
  if (koTrim === enTrim && !looksLikeCodeOrModel(enTrim)) return true
  if (hasLatin(koTrim) && !looksLikeCodeOrModel(koTrim)) return true
  return false
}

async function wikidataGetLabels(
  ids: string[],
  timeoutMs: number,
): Promise<Map<string, { en?: string; ja?: string; ko?: string }>> {
  if (ids.length === 0) return new Map()
  const url = buildWikidataApiUrl({
    action: 'wbgetentities',
    ids: ids.join('|'),
    props: 'labels',
    languages: 'en|ja|ko',
  })
  const data = await fetchJson<WikidataGetEntitiesResponse>(url, timeoutMs)
  const out = new Map<string, { en?: string; ja?: string; ko?: string }>()
  for (const [id, ent] of Object.entries(data.entities)) {
    const labels = ent.labels ?? {}
    out.set(id, {
      en: labels.en?.value,
      ja: labels.ja?.value,
      ko: labels.ko?.value,
    })
  }
  return out
}

async function wikidataSearchIds(en: string, timeoutMs: number): Promise<string[]> {
  const url = buildWikidataApiUrl({
    action: 'wbsearchentities',
    search: en,
    language: 'en',
    uselang: 'en',
    limit: '8',
  })
  const data = await fetchJson<WikidataSearchResponse>(url, timeoutMs)
  return data.search.map((s) => s.id)
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

main()
