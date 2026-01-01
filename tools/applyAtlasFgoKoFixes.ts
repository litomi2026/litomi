#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'

interface AtlasBasicServant {
  collectionNo: number
  name: string
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

  status.phase = 'atlasacademy_fgo_kr'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ changedKeys: baseKeys, changedFields: baseFields, note: 'already at target' }, null, 2),
    )
    return
  }

  const TIMEOUT_MS = 20_000
  const [jp, kr] = await Promise.all([
    fetchJson<AtlasBasicServant[]>('https://api.atlasacademy.io/export/JP/basic_servant.json', TIMEOUT_MS),
    fetchJson<AtlasBasicServant[]>('https://api.atlasacademy.io/export/KR/basic_servant.json', TIMEOUT_MS),
  ])

  const noToKr = new Map<number, string>()
  for (const s of kr) {
    if (!Number.isFinite(s.collectionNo)) continue
    noToKr.set(Number(s.collectionNo), String(s.name))
  }

  const jaNameToNo = new Map<string, number | null>()
  for (const s of jp) {
    const name = String(s.name)
    const no = Number(s.collectionNo)
    if (!name || !Number.isFinite(no)) continue
    if (jaNameToNo.has(name)) {
      jaNameToNo.set(name, null)
      continue
    }
    jaNameToNo.set(name, no)
  }

  const changedKeySet = new Set<string>()
  let changedFields = 0

  function bumpChange(key: string, from: string, to: string) {
    changedKeySet.add(key)
    changedFields += 1
    status.changedKeys = baseKeys + changedKeySet.size
    status.changedFields = baseFields + changedFields
    status.lastChangedKey = key
    status.lastChangedField = 'ko'
    status.lastChangedFrom = from
    status.lastChangedTo = to
    status.lastSource = 'atlasacademy_fgo_kr'
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

  try {
    const keys = Object.keys(dict)
    for (const key of keys) {
      if (changedKeySet.size >= remaining) break

      const entry = dict[key]
      const ja = String(entry.ja ?? '').trim()
      const ko = String(entry.ko ?? '').trim()
      if (!ja || !ko) continue

      const no = jaNameToNo.get(ja)
      if (!no) continue

      const koOff = noToKr.get(no)
      if (!koOff) continue

      if (ko === koOff) continue

      entry.ko = koOff
      bumpChange(key, ko, koOff)
      maybeFlush(false)
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
        addedKeys: changedKeySet.size,
        addedFields: changedFields,
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
