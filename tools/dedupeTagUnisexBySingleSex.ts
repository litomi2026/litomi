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

function getSuffixAfterPrefix(key: string): string | null {
  const idx = key.indexOf(':')
  if (idx === -1) return null
  const suffix = key.slice(idx + 1).trim()
  if (suffix.length === 0) return null
  return suffix
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const unisexPath = path.join(process.cwd(), 'src/translation/tag-unisex.json')
  const singleSexPath = path.join(process.cwd(), 'src/translation/tag-single-sex.json')

  const unisex = readJsonObject(unisexPath)
  const singleSex = readJsonObject(singleSexPath)

  const suffixesToRemove = new Set<string>()
  for (const key of Object.keys(singleSex)) {
    const suffix = getSuffixAfterPrefix(key)
    if (suffix) suffixesToRemove.add(suffix)
  }

  let removed = 0
  for (const suffix of suffixesToRemove) {
    if (suffix in unisex) {
      delete unisex[suffix]
      removed++
    }
  }

  console.log(
    `Would remove ${removed} key(s) from tag-unisex.json because a prefixed entry exists in tag-single-sex.json`,
  )
  console.log(args.write ? 'Mode: write' : 'Mode: dry-run')

  if (args.write) {
    writeJsonObject(unisexPath, unisex)
  }
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
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Failed to parse JSON: ${absPath}\n${msg}`)
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Unexpected JSON shape: ${absPath}`)
  }
  return parsed as Record<string, unknown>
}

function stableSortKeys<T>(obj: Record<string, T>): Record<string, T> {
  const entries = Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return Object.fromEntries(entries) as Record<string, T>
}

function writeJsonObject(absPath: string, obj: Record<string, unknown>) {
  const sorted = stableSortKeys(obj)
  fs.writeFileSync(absPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf-8')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
