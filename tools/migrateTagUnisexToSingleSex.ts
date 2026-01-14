#!/usr/bin/env bun

import fs from 'fs'
import path from 'path'
import { z } from 'zod'

type Args = {
  write: boolean
}

const ArgsSchema = z.object({
  write: z.boolean().default(false),
})

type Sex = 'female' | 'male'

function computeSexFromKeyAndEntry(key: string, entry: Record<string, unknown>): Sex | null {
  const en = typeof entry.en === 'string' ? entry.en : null
  const base = [key, en].filter((v): v is string => typeof v === 'string' && v.length > 0).join(' ')
  const tokens = new Set(tokenize(base))

  // Special-cases / shorthand
  const joined = base.toLowerCase()
  const hasFem = joined.includes('femdom') || tokens.has('femdom') || joined.startsWith('fem')
  if (hasFem) return 'female'

  const maleTokens = new Set([
    'boy',
    'boys',
    'brother',
    'butler',
    'dad',
    'father',
    'gentleman',
    'grandfather',
    'grandpa',
    'guy',
    'guys',
    'husband',
    'king',
    'male',
    'man',
    'men',
    'nephew',
    'policeman',
    'priest',
    'sir',
    'son',
    'uncle',
    'waiter',
    'widower',
  ])

  const femaleTokens = new Set([
    'aunt',
    'daughter',
    'female',
    'girl',
    'girls',
    'grandma',
    'grandmother',
    'lady',
    'madam',
    'maid',
    'milf',
    'mom',
    'mother',
    'niece',
    'nun',
    'policewoman',
    'queen',
    'sister',
    'waitress',
    'widow',
    'wife',
    'woman',
    'women',
  ])

  const maleHit = [...tokens].some((t) => maleTokens.has(t)) || joined.endsWith('boy') || joined.endsWith('guy')
  const femaleHit = [...tokens].some((t) => femaleTokens.has(t)) || joined.endsWith('girl') || joined.endsWith('woman')

  if (maleHit && !femaleHit) return 'male'
  if (femaleHit && !maleHit) return 'female'
  return null
}

function isBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0
}

function isTranslationEntry(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && 'en' in value
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const unisexPath = path.join(process.cwd(), 'src/translation/tag-unisex.json')
  const singleSexPath = path.join(process.cwd(), 'src/translation/tag-single-sex.json')

  const unisex = readJsonObject(unisexPath)
  const singleSex = readJsonObject(singleSexPath)

  let moved = 0
  let merged = 0

  for (const [key, value] of Object.entries(unisex)) {
    if (!isTranslationEntry(value)) continue

    const sex = computeSexFromKeyAndEntry(key, value)
    if (!sex) continue

    const targetKey = `${sex}:${key}`
    const existing = singleSex[targetKey]
    if (existing && isTranslationEntry(existing)) {
      singleSex[targetKey] = mergeEntryPreferTarget(existing, value)
      merged++
    } else if (!existing) {
      singleSex[targetKey] = value
      moved++
    } else {
      // unexpected existing shape, skip
      continue
    }

    delete unisex[key]
  }

  console.log(`Would move ${moved} key(s), merge ${merged} key(s) into tag-single-sex.json`)
  console.log(args.write ? 'Mode: write' : 'Mode: dry-run')

  if (args.write) {
    writeJsonObject(unisexPath, unisex)
    writeJsonObject(singleSexPath, singleSex)
  }
}

function mergeEntryPreferTarget(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target }
  for (const [k, v] of Object.entries(source)) {
    if (!(k in out)) {
      out[k] = v
      continue
    }
    const cur = out[k]
    if (isBlankString(cur) && typeof v === 'string' && v.trim().length > 0) {
      out[k] = v
    }
  }
  return out
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, unknown> = {}
  for (const v of argv) {
    if (v === '--write') raw.write = true
  }
  return ArgsSchema.parse(raw)
}

function readJsonObject(absPath: string): Record<string, unknown> {
  const raw = fs.readFileSync(absPath, 'utf-8')
  const parsed = JSON.parse(raw) as unknown
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Unexpected JSON shape: ${absPath}`)
  }
  return parsed as Record<string, unknown>
}

function stableSortKeys<T>(obj: Record<string, T>): Record<string, T> {
  const entries = Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return Object.fromEntries(entries) as Record<string, T>
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .split(/[^a-z]+/g)
    .filter(Boolean)
}

function writeJsonObject(absPath: string, obj: Record<string, unknown>) {
  const sorted = stableSortKeys(obj)
  fs.writeFileSync(absPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf-8')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
