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

interface EnemyHandbookEntry {
  name?: string
}

interface EnemyHandbookTable {
  enemyData?: Record<string, EnemyHandbookEntry>
}

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

  status.phase = 'arknights_enemy_handbook'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('20s')
  const baseUrl = 'https://raw.githubusercontent.com/Kengxxiao/ArknightsGameData_YoStar/main'

  const [enHB, koHB, jaHB] = await Promise.all([
    fetchJson<EnemyHandbookTable>(`${baseUrl}/en_US/gamedata/excel/enemy_handbook_table.json`, TIMEOUT),
    fetchJson<EnemyHandbookTable>(`${baseUrl}/ko_KR/gamedata/excel/enemy_handbook_table.json`, TIMEOUT),
    fetchJson<EnemyHandbookTable>(`${baseUrl}/ja_JP/gamedata/excel/enemy_handbook_table.json`, TIMEOUT),
  ])

  const enEnemies = enHB.enemyData ?? {}
  const koEnemies = koHB.enemyData ?? {}
  const jaEnemies = jaHB.enemyData ?? {}

  // Build a unique index by (en, jaNormalized) to reduce collisions.
  const index = new Map<string, { ko: string; ja: string } | null>()
  for (const enemyId of Object.keys(enEnemies)) {
    const enName = normalizeEn(String(enEnemies[enemyId]?.name ?? ''))
    const koName = String(koEnemies[enemyId]?.name ?? '').trim()
    const jaName = String(jaEnemies[enemyId]?.name ?? '').trim()
    if (!enName || !koName || !jaName) continue
    const key = `${enName}|||${normalizeJa(jaName)}`
    if (index.has(key)) {
      index.set(key, null)
      continue
    }
    index.set(key, { ko: koName, ja: jaName })
  }

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
    status.lastSource = 'arknights_enemy_handbook'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  const dictKeys = Object.keys(dict).sort((a, b) => a.localeCompare(b))
  for (const k of dictKeys) {
    if (changedKeySet.size >= remaining) break

    const entry = dict[k]
    const en = normalizeEn(String(entry.en ?? ''))
    const ja = String(entry.ja ?? '').trim()
    if (!en || !ja) continue

    bumpChecked(k)

    const hit = index.get(`${en}|||${normalizeJa(ja)}`)
    if (!hit) continue
    if (hit === null) continue

    const koOff = hit.ko
    const jaOff = hit.ja

    const koCur = String(entry.ko ?? '').trim()
    if (koCur !== koOff) {
      entry.ko = koOff
      bumpChange(k, 'ko', koCur, koOff)
    }

    const jaCur = String(entry.ja ?? '').trim()
    if (jaCur !== jaOff) {
      entry.ja = jaOff
      bumpChange(k, 'ja', jaCur, jaOff)
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

function normalizeEn(value: string): string {
  return value.trim()
}

function normalizeJa(value: string): string {
  return value.trim().replaceAll('・', '').replaceAll(' ', '').replaceAll('　', '')
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
