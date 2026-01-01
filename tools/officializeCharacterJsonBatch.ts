#!/usr/bin/env bun

import fs from 'fs'
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
  errorsCount: number
  lastChangedField: LocaleKey | null
  lastChangedFrom: string | null
  lastChangedKey: string | null
  lastChangedTo: string | null
  lastError: string | null
  lastSource: string | null
  phase?: string
  startedAt: string
  targetKeysToChange: number
  updatedAt: string
}

function buildEnToKeys(dict: CharacterTranslationDict): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const [key, t] of Object.entries(dict)) {
    const en = (t.en ?? '').trim()
    if (!en) continue
    const existing = map.get(en)
    if (existing) {
      existing.push(key)
      continue
    }
    map.set(en, [key])
  }
  return map
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractAsciiSegments(value: string): string[] {
  const re = /[A-Za-z0-9]{2,}(?:-[A-Za-z0-9]{1,})*/g
  const out = new Set<string>()
  let m: RegExpExecArray | null = null
  while ((m = re.exec(value))) {
    out.add(m[0])
  }
  return [...out]
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status} ${url}`)
  }
  return (await res.json()) as T
}

function isCodeLike(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^[0-9][0-9./-]*$/.test(v)) return true
  if (/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(v)) return true
  if (/^[A-Z0-9\s./-]+$/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)) return true
  if (/^([A-Za-z0-9]\.){2,}[A-Za-z0-9]*\.?$/.test(v)) return true
  if (/^[A-Za-z]{1,4}[0-9]{1,4}[A-Za-z]?$/.test(v)) return true
  if (/^[A-Za-z]{2,6}\s+[0-9]{1,4}$/.test(v)) return true
  if (/^[A-Za-z]{2,12}\s+[A-Z]{2,6}$/.test(v)) return true
  return false
}

async function main() {
  const { target, writeEvery, statusPath } = parseArgs(process.argv.slice(2))

  const repoRoot = process.cwd()
  const translationPath = path.join(repoRoot, 'src', 'translation', 'character.json')
  const statusAbsPath = path.isAbsolute(statusPath) ? statusPath : path.join(repoRoot, statusPath)

  const dict = readJsonFile<CharacterTranslationDict>(translationPath)
  const keysSet = new Set(Object.keys(dict))

  const status = readJsonFile<StatusFile>(statusAbsPath)
  if (!status.startedAt) status.startedAt = nowIso()
  status.updatedAt = nowIso()
  status.targetKeysToChange = target
  status.phase = 'running'
  writeJsonFile(statusAbsPath, status)

  const changedKeySet = new Set<string>()
  let changedFields = 0

  function bumpStatusFromChange(key: string, field: LocaleKey, from: string, to: string, source: string) {
    if (!changedKeySet.has(key)) {
      changedKeySet.add(key)
    }
    changedFields++

    status.changedKeys = changedKeySet.size
    status.changedFields = changedFields
    status.lastChangedKey = key
    status.lastChangedField = field
    status.lastChangedFrom = from
    status.lastChangedTo = to
    status.lastSource = source
    status.updatedAt = nowIso()
  }

  function bumpStatusError(err: unknown) {
    status.errorsCount = (status.errorsCount ?? 0) + 1
    status.lastError = String(err)
    status.updatedAt = nowIso()
  }

  function maybeFlush(writeNow: boolean) {
    if (writeNow || status.changedKeys % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  function setField(key: string, field: LocaleKey, to: string, source: string) {
    const entry = dict[key]
    if (!entry) return
    const from = String(entry[field] ?? '')
    if (from === to) return
    entry[field] = to as never
    bumpStatusFromChange(key, field, from, to, source)
    maybeFlush(false)
  }

  function canContinue(): boolean {
    return changedKeySet.size < target
  }

  // 1) LoL official names (Data Dragon)
  try {
    status.phase = 'lol_ddragon'
    writeJsonFile(statusAbsPath, { ...status, updatedAt: nowIso() })

    const TIMEOUT_MS = 10_000
    const versions = await fetchJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json', TIMEOUT_MS)
    const ver = versions[0]

    type ChampionFull = { data: Record<string, { name: string }> }
    const en = await fetchJson<ChampionFull>(
      `https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/championFull.json`,
      TIMEOUT_MS,
    )
    const ko = await fetchJson<ChampionFull>(
      `https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/championFull.json`,
      TIMEOUT_MS,
    )
    const ja = await fetchJson<ChampionFull>(
      `https://ddragon.leagueoflegends.com/cdn/${ver}/data/ja_JP/championFull.json`,
      TIMEOUT_MS,
    )

    for (const id of Object.keys(en.data)) {
      if (!canContinue()) break
      const key1 = id.toLowerCase()
      const key2 = toSnake(id)
      const key = keysSet.has(key1) ? key1 : keysSet.has(key2) ? key2 : null
      if (!key) continue

      setField(key, 'en', en.data[id].name, 'ddragon')
      const koName = ko.data[id]?.name
      if (koName) setField(key, 'ko', koName, 'ddragon')
      const jaName = ja.data[id]?.name
      if (jaName) setField(key, 'ja', jaName, 'ddragon')
    }
  } catch (e) {
    bumpStatusError(e)
    writeJsonFile(statusAbsPath, status)
  }

  // 2) Pokémon official names (PokeAPI)
  try {
    status.phase = 'pokemon_pokeapi'
    writeJsonFile(statusAbsPath, { ...status, updatedAt: nowIso() })

    type SpeciesList = { results: { name: string; url: string }[] }
    type SpeciesDetail = {
      name: string
      names: { language: { name: string }; name: string }[]
    }

    const TIMEOUT_MS = 10_000
    const CONCURRENCY = 10

    const enToKeys = buildEnToKeys(dict)
    const list = await fetchJson<SpeciesList>(
      'https://pokeapi.co/api/v2/pokemon-species?limit=200000&offset=0',
      TIMEOUT_MS,
    )
    const urls = list.results.map((r) => r.url)

    function nameOf(names: SpeciesDetail['names'], lang: string): string | null {
      const hit = names.find((n) => n.language.name === lang)
      return hit?.name ?? null
    }

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      if (!canContinue()) break
      const batch = urls.slice(i, i + CONCURRENCY)
      const results = await Promise.all(
        batch.map(async (url) => {
          try {
            return await fetchJson<SpeciesDetail>(url, TIMEOUT_MS)
          } catch (e) {
            return { __error: String(e) } as unknown as SpeciesDetail
          }
        }),
      )

      for (const sp of results) {
        if (!canContinue()) break
        if ((sp as unknown as { __error?: string }).__error) continue

        const enName = nameOf(sp.names, 'en') ?? sp.name
        const keys = enToKeys.get(enName)
        if (!keys || keys.length === 0) continue

        const koName = nameOf(sp.names, 'ko')
        const jaName = nameOf(sp.names, 'ja-Hrkt') ?? nameOf(sp.names, 'ja')
        if (!koName || !jaName) continue

        for (const key of keys) {
          if (!canContinue()) break
          setField(key, 'ko', koName, 'pokeapi')
          setField(key, 'ja', jaName, 'pokeapi')
        }
      }
    }
  } catch (e) {
    bumpStatusError(e)
    writeJsonFile(statusAbsPath, status)
  }

  // 3) Formatting: align en casing to ASCII segments present in ko/ja (safe typo fixes)
  status.phase = 'format_en_from_ko_ja'
  writeJsonFile(statusAbsPath, { ...status, updatedAt: nowIso() })

  const enExceptions = new Set<string>([
    // KanColle: the standard romanization is commonly written as "Ro-500"
    'ro-500',
  ])

  for (const [key, t] of Object.entries(dict)) {
    if (!canContinue()) break
    if (enExceptions.has(key)) continue

    const en = String(t.en ?? '')
    const ko = String(t.ko ?? '')
    const ja = String(t.ja ?? '')

    const segments = [...extractAsciiSegments(ko), ...extractAsciiSegments(ja)]
    if (segments.length === 0) continue

    let next = en
    for (const seg of segments) {
      if (!new RegExp(escapeRegExp(seg), 'i').test(next)) continue
      next = replaceAllCaseInsensitive(next, seg)
    }

    if (next !== en) {
      setField(key, 'en', next, 'format_from_ko_ja')
    }
  }

  // 4) Normalize en to ko for code-like labels (very safe), except known exceptions
  status.phase = 'normalize_code_en'
  writeJsonFile(statusAbsPath, { ...status, updatedAt: nowIso() })

  const codeEnExceptions = new Set<string>([
    // Keep KanColle romanization casing
    'ro-500',
  ])

  for (const [key, t] of Object.entries(dict)) {
    if (!canContinue()) break
    if (codeEnExceptions.has(key)) continue
    const ko = String(t.ko ?? '').trim()
    const en = String(t.en ?? '').trim()
    if (!ko || !en) continue
    if (!/^[\x20-\x7E]+$/.test(ko)) continue
    if (!isCodeLike(ko)) continue
    if (en === ko) continue
    setField(key, 'en', ko, 'normalize_code_en_from_ko')
  }

  status.phase = 'done'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)
  writeJsonFile(translationPath, dict)

  console.log(
    JSON.stringify(
      {
        changedKeys: changedKeySet.size,
        changedFields,
        statusFile: path.relative(repoRoot, statusAbsPath),
      },
      null,
      2,
    ),
  )
}

function nowIso(): string {
  return new Date().toISOString()
}

function parseArgs(args: string[]) {
  const targetIndex = args.indexOf('--target')
  const targetRaw = targetIndex >= 0 ? args[targetIndex + 1] : undefined
  const target = targetRaw ? Number(targetRaw) : 100
  if (!Number.isFinite(target) || target <= 0) {
    throw new Error(`--target 값이 올바르지 않아요: ${targetRaw}`)
  }

  const writeEveryIndex = args.indexOf('--write-every')
  const writeEveryRaw = writeEveryIndex >= 0 ? args[writeEveryIndex + 1] : undefined
  const writeEvery = writeEveryRaw ? Number(writeEveryRaw) : 10
  if (!Number.isFinite(writeEvery) || writeEvery <= 0) {
    throw new Error(`--write-every 값이 올바르지 않아요: ${writeEveryRaw}`)
  }

  const statusIndex = args.indexOf('--status')
  const statusPath = statusIndex >= 0 ? args[statusIndex + 1] : 'tools/character-officialize-status.json'
  if (!statusPath || statusPath.startsWith('--')) {
    throw new Error('--status 다음에 파일 경로가 필요해요')
  }

  return { target, writeEvery, statusPath }
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function replaceAllCaseInsensitive(haystack: string, needleExact: string): string {
  const re = new RegExp(escapeRegExp(needleExact), 'gi')
  return haystack.replace(re, needleExact)
}

function toSnake(id: string): string {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

main()
