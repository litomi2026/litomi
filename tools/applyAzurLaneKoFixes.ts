#!/usr/bin/env bun

import fs from 'fs'
import ms from 'ms'
import path from 'path'

type AzurLaneShipDataStatistics = Record<string, AzurLaneShipDataStatisticsEntry>

interface AzurLaneShipDataStatisticsEntry {
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

function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) }).then(async (r) => {
    if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
    return (await r.json()) as T
  })
}

function hasCjk(value: string): boolean {
  return /[一-龯々]/.test(value)
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value)
}

function hasKana(value: string): boolean {
  return /[ぁ-んァ-ヶ]/.test(value)
}

function isAscii(value: string): boolean {
  return /^[\x20-\x7E]+$/.test(value)
}

function isSpecialAzurLaneId(id: string): boolean {
  const n = Number(id)
  return Number.isFinite(n) && n >= 900_000
}

function keyCandidatesFromEnName(enName: string): string[] {
  const base = enName.trim().toLowerCase().replace(/\s+/g, '_')
  const out = new Set<string>([base])

  out.add(base.replaceAll('.', ''))
  out.add(base.replaceAll("'", ''))
  out.add(base.replaceAll('’', ''))
  out.add(base.replaceAll("'", '').replaceAll('’', '').replaceAll('.', ''))
  out.add(base.replaceAll('-', '_'))
  out.add(base.replaceAll('-', '_').replaceAll("'", '').replaceAll('’', '').replaceAll('.', ''))

  return [...out]
}

async function main() {
  const { statusPath, writeEvery } = parseArgs(process.argv.slice(2))

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

  status.phase = 'azurlane'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('30s')
  const baseUrl = 'https://raw.githubusercontent.com/AzurLaneTools/AzurLaneData/main'

  const [enShip, koShip, jaShip] = await Promise.all([
    fetchJson<AzurLaneShipDataStatistics>(`${baseUrl}/EN/sharecfgdata/ship_data_statistics.json`, TIMEOUT),
    fetchJson<AzurLaneShipDataStatistics>(`${baseUrl}/KR/sharecfgdata/ship_data_statistics.json`, TIMEOUT),
    fetchJson<AzurLaneShipDataStatistics>(`${baseUrl}/JP/sharecfgdata/ship_data_statistics.json`, TIMEOUT),
  ])

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
    status.lastChangedField = field
    status.lastChangedFrom = from
    status.lastChangedKey = key
    status.lastChangedTo = to
    status.lastSource = 'azurlane'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  try {
    const ids = Object.keys(enShip).sort((a, b) => a.localeCompare(b))
    const seenKeys = new Set<string>()
    for (const id of ids) {
      if (changedKeySet.size >= remaining) break
      if (isSpecialAzurLaneId(id)) continue

      const enName = String(enShip[id]?.name ?? '').trim()
      const koOff = String(koShip[id]?.name ?? '').trim()
      const jaOff = String(jaShip[id]?.name ?? '').trim()
      if (!enName || !koOff || !jaOff) continue

      for (const cand of keyCandidatesFromEnName(enName)) {
        if (changedKeySet.size >= remaining) break
        if (!dictKeys.has(cand)) continue
        if (seenKeys.has(cand)) continue

        const cur = dict[cand]
        // Safety: require en value match (exact) so we don't collide with other franchises sharing the same key.
        if (String(cur.en ?? '').trim() !== enName) continue

        bumpChecked(cand)

        // Safety: KR should not be pure CJK/kana. Allow Hangul or ASCII (codes like U-47).
        if (!hasHangul(koOff) && !isAscii(koOff)) break
        if (hasCjk(koOff) || hasKana(koOff)) break

        // Safety: don't replace kana Japanese names with non-kana strings (e.g., CN fallback in JP table).
        const jaCur = String(cur.ja ?? '').trim()
        const jaCurHasKana = hasKana(jaCur)
        const jaOffHasKana = hasKana(jaOff)
        if (jaCurHasKana && !jaOffHasKana) break

        const koCur = String(cur.ko ?? '').trim()
        if (koCur !== koOff) {
          cur.ko = koOff
          bumpChange(cand, 'ko', koCur, koOff)
        }

        if (jaCur !== jaOff) {
          cur.ja = jaOff
          bumpChange(cand, 'ja', jaCur, jaOff)
        }

        seenKeys.add(cand)
        break
      }

      maybeFlush(false)
      if ((status.checked ?? 0) % 25 === 0) {
        maybeFlush(true)
      }
    }
  } catch (e) {
    bumpError(e)
  } finally {
    status.phase = status.changedKeys >= target ? 'done' : status.phase
    status.updatedAt = nowIso()
    writeJsonFile(statusAbsPath, status)
    writeJsonFile(translationPath, dict)
  }

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

  return { statusPath, writeEvery }
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

main()
