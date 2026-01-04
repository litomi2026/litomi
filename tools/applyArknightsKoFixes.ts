#!/usr/bin/env bun

import fs from 'fs'
import ms from 'ms'
import path from 'path'

type ArknightsCharacterTable = Record<string, ArknightsCharacterTableEntry>

interface ArknightsCharacterTableEntry {
  name?: string
}

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

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return (await r.json()) as T
}

function keyCandidatesFromEnName(enName: string): string[] {
  const base = enName.trim().toLowerCase().replace(/\s+/g, '_')
  const out = new Set<string>([base])

  const normalizeApostrophe = (s: string) => s.replace(/[’‘]/g, "'")
  const removeApostrophe = (s: string) => s.replace(/[’‘']/g, '')

  out.add(normalizeApostrophe(base))
  out.add(removeApostrophe(base))
  out.add(removeApostrophe(base).replaceAll('.', ''))
  out.add(base.replaceAll('.', ''))
  out.add(base.replaceAll('-', '_'))
  out.add(removeApostrophe(base.replaceAll('-', '_')))

  return [...out]
}

async function main() {
  const { writeEvery, statusPath } = parseArgs(process.argv.slice(2))

  const repoRoot = process.cwd()
  const translationPath = path.join(repoRoot, 'src', 'translation', 'character.json')
  const statusAbsPath = path.isAbsolute(statusPath) ? statusPath : path.join(repoRoot, statusPath)

  const dict = readJsonFile<CharacterTranslationDict>(translationPath)
  const dictKeys = new Set(Object.keys(dict))

  const status = readJsonFile<StatusFile>(statusAbsPath)
  const target = status.targetKeysToChange ?? 100
  const baseKeys = status.changedKeys ?? 0
  const baseFields = status.changedFields ?? 0
  const remaining = Math.max(0, target - baseKeys)

  status.phase = 'arknights_yostar'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('30s')
  const baseUrl = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main'

  const [enTable, koTable, jaTable] = await Promise.all([
    fetchJson<ArknightsCharacterTable>(`${baseUrl}/en_US/gamedata/excel/character_table.json`, TIMEOUT),
    fetchJson<ArknightsCharacterTable>(`${baseUrl}/ko_KR/gamedata/excel/character_table.json`, TIMEOUT),
    fetchJson<ArknightsCharacterTable>(`${baseUrl}/ja_JP/gamedata/excel/character_table.json`, TIMEOUT),
  ])

  const changedKeySet = new Set<string>()
  let addedFields = 0

  function bumpChecked(key: string) {
    status.checked = (status.checked ?? 0) + 1
    status.lastCheckedKey = key
    status.updatedAt = nowIso()
  }

  function _bumpError(err: unknown) {
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
    status.lastSource = 'arknights_yostar'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  // Deterministic iteration for reproducibility.
  const charIds = Object.keys(enTable).sort((a, b) => a.localeCompare(b))

  for (const charId of charIds) {
    if (changedKeySet.size >= remaining) break

    const enName = String(enTable[charId]?.name ?? '').trim()
    if (!enName) continue

    let key: string | null = null
    for (const cand of keyCandidatesFromEnName(enName)) {
      if (dictKeys.has(cand)) {
        key = cand
        break
      }
    }
    if (!key) continue

    bumpChecked(key)

    const cur = dict[key]
    const koOff = String(koTable[charId]?.name ?? '').trim()
    const jaOff = String(jaTable[charId]?.name ?? '').trim()

    if (!koOff && !jaOff) continue

    if (koOff) {
      const koCur = String(cur.ko ?? '').trim()
      if (koCur !== koOff) {
        cur.ko = koOff
        bumpChange(key, 'ko', koCur, koOff)
      }
    }

    if (jaOff) {
      const jaCur = String(cur.ja ?? '').trim()
      if (jaCur !== jaOff) {
        cur.ja = jaOff
        bumpChange(key, 'ja', jaCur, jaOff)
      }
    }

    maybeFlush(false)

    if ((status.checked ?? 0) % 25 === 0) {
      maybeFlush(true)
    }
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
