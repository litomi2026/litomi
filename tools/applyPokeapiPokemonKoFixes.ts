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

type SpeciesDetail = {
  name: string
  names: { language: { name: string }; name: string }[]
}

type SpeciesList = { results: { name: string; url: string }[] }

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

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return (await r.json()) as T
}

async function main() {
  const { writeEvery, statusPath } = parseArgs(process.argv.slice(2))

  const repoRoot = process.cwd()
  const translationPath = path.join(repoRoot, 'src', 'translation', 'character.json')
  const statusAbsPath = path.isAbsolute(statusPath) ? statusPath : path.join(repoRoot, statusPath)

  const dict = readJsonFile<CharacterTranslationDict>(translationPath)
  const enToKeys = buildEnToKeys(dict)

  const status = readJsonFile<StatusFile>(statusAbsPath)
  const target = status.targetKeysToChange ?? 100
  const baseKeys = status.changedKeys ?? 0
  const baseFields = status.changedFields ?? 0
  const remaining = Math.max(0, target - baseKeys)

  status.phase = 'pokemon_pokeapi'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('20s')
  const CONCURRENCY = 5

  const changedKeySet = new Set<string>()
  let addedFields = 0

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

  function bumpChange(key: string, field: LocaleKey, from: string, to: string) {
    changedKeySet.add(key)
    addedFields += 1

    status.changedKeys = baseKeys + changedKeySet.size
    status.changedFields = baseFields + addedFields
    status.lastChangedKey = key
    status.lastChangedField = field
    status.lastChangedFrom = from
    status.lastChangedTo = to
    status.lastSource = 'pokeapi'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  try {
    const list = await fetchJson<SpeciesList>(
      'https://pokeapi.co/api/v2/pokemon-species?limit=200000&offset=0',
      TIMEOUT,
    )
    const urls = list.results.map((r) => r.url)

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      if (changedKeySet.size >= remaining) break

      const batch = urls.slice(i, i + CONCURRENCY)
      const details = await Promise.all(
        batch.map(async (url) => {
          try {
            return await fetchJson<SpeciesDetail>(url, TIMEOUT)
          } catch {
            return null
          }
        }),
      )

      for (const sp of details) {
        if (changedKeySet.size >= remaining) break
        if (!sp) continue

        const enName = nameOf(sp.names, 'en') ?? sp.name
        const keys = enToKeys.get(enName)
        if (!keys || keys.length === 0) continue

        const koName = nameOf(sp.names, 'ko')
        const jaName = nameOf(sp.names, 'ja-Hrkt') ?? nameOf(sp.names, 'ja')
        if (!koName || !jaName) continue

        for (const key of keys) {
          if (changedKeySet.size >= remaining) break

          const cur = dict[key]
          if (!cur) continue
          if (String(cur.en ?? '').trim() !== enName) continue

          bumpChecked(key)

          const koCur = String(cur.ko ?? '').trim()
          if (koCur !== koName) {
            cur.ko = koName
            bumpChange(key, 'ko', koCur, koName)
          }

          const jaCur = String(cur.ja ?? '').trim()
          if (jaCur !== jaName) {
            cur.ja = jaName
            bumpChange(key, 'ja', jaCur, jaName)
          }

          maybeFlush(false)

          if ((status.checked ?? 0) % 25 === 0) {
            maybeFlush(true)
          }
        }
      }
    }
  } catch (e) {
    bumpError(e)
  }

  status.phase = status.changedKeys >= target ? 'done' : status.phase
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)
  writeJsonFile(translationPath, dict)

  console.log(
    JSON.stringify(
      {
        remainingTarget: remaining,
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

function nameOf(names: SpeciesDetail['names'], lang: string): string | null {
  const hit = names.find((n) => n.language.name === lang)
  return hit?.name ?? null
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

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

main()
