#!/usr/bin/env bun

import fs from 'fs'
import ms from 'ms'
import path from 'path'

type ChampionFull = { data: Record<string, { name: string }> }

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
  const dictKeys = new Set(Object.keys(dict))
  const enToKeys = buildEnToKeys(dict)

  const status = readJsonFile<StatusFile>(statusAbsPath)
  const target = status.targetKeysToChange ?? 100
  const baseKeys = status.changedKeys ?? 0
  const baseFields = status.changedFields ?? 0
  const remaining = Math.max(0, target - baseKeys)

  status.phase = 'lol_ddragon'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('20s')
  const versions = await fetchJson<string[]>('https://ddragon.leagueoflegends.com/api/versions.json', TIMEOUT)
  const ver = versions[0]
  const [en2, ko2, ja2] = await Promise.all([
    fetchJson<ChampionFull>(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/en_US/championFull.json`, TIMEOUT),
    fetchJson<ChampionFull>(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ko_KR/championFull.json`, TIMEOUT),
    fetchJson<ChampionFull>(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/ja_JP/championFull.json`, TIMEOUT),
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
    status.lastChangedKey = key
    status.lastChangedField = field
    status.lastChangedFrom = from
    status.lastChangedTo = to
    status.lastSource = 'ddragon'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  try {
    const champIds = Object.keys(en2.data).sort((a, b) => a.localeCompare(b))
    for (const champId of champIds) {
      if (changedKeySet.size >= remaining) break

      const enName = String(en2.data[champId]?.name ?? '').trim()
      const koName = String(ko2.data[champId]?.name ?? '').trim()
      const jaName = String(ja2.data[champId]?.name ?? '').trim()
      if (!enName || !koName || !jaName) continue

      const keyCandidates = new Set<string>()
      keyCandidates.add(champId.toLowerCase())
      keyCandidates.add(toSnake(champId))

      const byEn = enToKeys.get(enName) ?? []
      for (const k of byEn) keyCandidates.add(k)

      for (const key of keyCandidates) {
        if (changedKeySet.size >= remaining) break
        if (!dictKeys.has(key)) continue

        const cur = dict[key]
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
