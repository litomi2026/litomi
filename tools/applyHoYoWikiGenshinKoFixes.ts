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

interface HoYoWikiEntryListItem {
  entry_page_id: string
  name: string
}

interface HoYoWikiEntryPagesItem {
  id: string
  name: string
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

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`fetch failed: ${r.status} ${url}`)
  return JSON.parse(await r.text()) as T
}

function hasHangul(value: string): boolean {
  return /[가-힣]/.test(value)
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

  status.phase = 'hoyowiki_genshin'
  status.updatedAt = nowIso()
  writeJsonFile(statusAbsPath, status)

  if (remaining === 0) {
    console.log(
      JSON.stringify({ note: 'already at target', changedKeys: baseKeys, changedFields: baseFields }, null, 2),
    )
    return
  }

  const TIMEOUT = ms('20s')

  const commonHeaders: Record<string, string> = {
    'user-agent': 'Mozilla/5.0',
    referer: 'https://wiki.hoyolab.com/pc/genshin/home',
    origin: 'https://wiki.hoyolab.com',
    accept: 'application/json, text/plain, */*',
  }

  async function postEntryPageList(
    menuId: string,
    pageNum: number,
  ): Promise<{ list: HoYoWikiEntryListItem[]; total: number }> {
    const url = 'https://sg-wiki-api.hoyolab.com/hoyowiki/genshin/wapi/get_entry_page_list?lang=en-us'
    const data = await fetchJson<{ data?: { list?: HoYoWikiEntryListItem[]; total?: string } }>(
      url,
      {
        method: 'POST',
        headers: { ...commonHeaders, 'content-type': 'application/json;charset=UTF-8' },
        body: JSON.stringify({ menu_id: menuId, page_num: pageNum, page_size: 30 }),
      },
      TIMEOUT,
    )
    const list = data.data?.list ?? []
    const total = Number(data.data?.total ?? 0)
    return { list, total }
  }

  async function getEntryPagesNames(ids: string[], lang: 'ja-jp' | 'ko-kr'): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const url = `https://sg-wiki-api-static.hoyolab.com/hoyowiki/genshin/wapi/entry_pages?str_entry_page_ids=${ids.join(
      ',',
    )}&lang=${lang}`
    const data = await fetchJson<{ data?: { entry_pages?: HoYoWikiEntryPagesItem[] } }>(
      url,
      { headers: commonHeaders },
      TIMEOUT,
    )
    const out = new Map<string, string>()
    for (const ep of data.data?.entry_pages ?? []) {
      out.set(String(ep.id), String(ep.name ?? '').trim())
    }
    return out
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
    status.lastSource = 'hoyowiki_genshin'
    status.updatedAt = nowIso()
  }

  function maybeFlush(force: boolean) {
    if (force || changedKeySet.size % writeEvery === 0) {
      writeJsonFile(statusAbsPath, status)
      writeJsonFile(translationPath, dict)
    }
  }

  // Menus that tend to overlap with our character.json and have stable official names.
  // - 10: NPC Archive
  // - 7: Enemies and Monsters
  // - 4: Weapons
  // - 2: Character Archive
  const menuIds = ['10', '7', '4', '2']

  try {
    for (const menuId of menuIds) {
      if (changedKeySet.size >= remaining) break

      let pageNum = 1
      let total = Number.POSITIVE_INFINITY
      while (changedKeySet.size < remaining) {
        const { list, total: totalCount } = await postEntryPageList(menuId, pageNum)
        if (pageNum === 1) total = totalCount
        if (list.length === 0) break

        const ids = list.map((it) => String(it.entry_page_id))
        const [koMap, jaMap] = await Promise.all([getEntryPagesNames(ids, 'ko-kr'), getEntryPagesNames(ids, 'ja-jp')])

        for (const it of list) {
          if (changedKeySet.size >= remaining) break

          const id = String(it.entry_page_id)
          const enName = String(it.name ?? '').trim()
          const koName = String(koMap.get(id) ?? '').trim()
          const jaName = String(jaMap.get(id) ?? '').trim()
          if (!enName || !koName || !jaName) continue
          if (!hasHangul(koName)) continue

          const keys = enToKeys.get(enName)
          if (!keys || keys.length === 0) continue

          for (const key of keys) {
            if (changedKeySet.size >= remaining) break
            const cur = dict[key]
            if (!cur) continue
            if (String(cur.en ?? '').trim() !== enName) continue

            const jaCur = String(cur.ja ?? '').trim()
            if (!jaCur) continue
            if (normalizeJa(jaCur) !== normalizeJa(jaName)) continue

            bumpChecked(key)

            const koCur = String(cur.ko ?? '').trim()
            if (koCur !== koName) {
              cur.ko = koName
              bumpChange(key, 'ko', koCur, koName)
            }

            maybeFlush(false)
            if ((status.checked ?? 0) % 25 === 0) {
              maybeFlush(true)
            }
          }
        }

        pageNum += 1
        if (pageNum > Math.ceil(total / 30) + 2) break
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

function normalizeJa(value: string): string {
  return value.trim().replaceAll('・', '').replaceAll('·', '').replaceAll(' ', '').replaceAll('　', '')
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
