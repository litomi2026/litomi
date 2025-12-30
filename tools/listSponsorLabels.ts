import { readFileSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'

type EntityType = 'all' | 'artist' | 'character'

type SponsorLink = {
  label: string
  value: string
}

type SponsorsMap = Record<string, SponsorLink[]>
type View = 'generated' | 'merged' | 'override'

const SponsorLinkSchema: z.ZodType<SponsorLink> = z.object({
  label: z.string(),
  value: z.string(),
})

const SponsorsMapSchema: z.ZodType<SponsorsMap> = z.record(z.string(), z.array(SponsorLinkSchema))

const ArgsSchema = z.object({
  type: z.enum(['artist', 'character', 'all']).default('all'),
  view: z.enum(['generated', 'override', 'merged']).default('merged'),
  json: z.boolean().default(false),
})

type Args = z.infer<typeof ArgsSchema>

type LabelStats = {
  label: string
  linkCount: number
  entityCount: number
}

function collectLabelStats(map: SponsorsMap): LabelStats[] {
  const byLabel = new Map<string, { linkCount: number; entities: Set<string> }>()

  for (const [entityKey, links] of Object.entries(map)) {
    for (const link of links) {
      const label = link.label.trim()
      if (!label) continue

      const current = byLabel.get(label) ?? { linkCount: 0, entities: new Set<string>() }
      current.linkCount += 1
      current.entities.add(entityKey)
      byLabel.set(label, current)
    }
  }

  const out: LabelStats[] = []
  for (const [label, v] of byLabel.entries()) {
    out.push({ label, linkCount: v.linkCount, entityCount: v.entities.size })
  }

  return out.sort((a, b) => b.linkCount - a.linkCount || a.label.localeCompare(b.label))
}

function formatTable(stats: LabelStats[]) {
  const rows = stats.map((s) => [s.label, String(s.linkCount), String(s.entityCount)])
  const header = ['label', 'links', 'entities']
  const all = [header, ...rows]

  const widths = header.map((_, col) => Math.max(...all.map((r) => (r[col] ?? '').length)))
  const pad = (value: string, width: number) => value + ' '.repeat(Math.max(0, width - value.length))

  return all
    .map((r) =>
      r
        .map((v, i) => pad(v ?? '', widths[i] ?? 0))
        .join('  ')
        .trimEnd(),
    )
    .join('\n')
}

function getPaths(type: Exclude<EntityType, 'all'>) {
  const base = join(process.cwd(), 'src', 'sponsor')
  return {
    generatedPath: join(base, `${type}.json`),
    overridePath: join(base, `${type}.json`),
  }
}

function loadSponsors(params: { type: Exclude<EntityType, 'all'>; view: View }): SponsorsMap {
  const { generatedPath, overridePath } = getPaths(params.type)
  const generated = readJsonFile(generatedPath, SponsorsMapSchema)
  const override = readJsonFile(overridePath, SponsorsMapSchema)

  if (params.view === 'generated') return generated
  if (params.view === 'override') return override
  return mergeSponsors(generated, override)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const types: Array<Exclude<EntityType, 'all'>> = args.type === 'all' ? ['artist', 'character'] : [args.type]

  const perType = types.map((type) => {
    const map = loadSponsors({ type, view: args.view })
    const stats = collectLabelStats(map)
    return { type, stats }
  })

  if (args.json) {
    const payload = {
      view: args.view,
      types: perType,
    }
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  for (const block of perType) {
    console.log('—')
    console.log(`🏷️  type=${block.type} view=${args.view} labels=${block.stats.length.toLocaleString()}개`)
    console.log(formatTable(block.stats))
  }
  console.log('—')
}

function mergeSponsors(generated: SponsorsMap, override: SponsorsMap): SponsorsMap {
  return { ...generated, ...override }
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, boolean | string> = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token || !token.startsWith('--')) continue

    const [flag, inlineValue] = token.split('=', 2)
    const key = flag.replace(/^--/, '')
    if (!key) continue

    if (inlineValue !== undefined) {
      raw[key] = inlineValue
      continue
    }

    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      raw[key] = next
      i += 1
      continue
    }

    raw[key] = true
  }

  const parsed = ArgsSchema.safeParse({
    type: raw.type,
    view: raw.view,
    json: raw.json === true,
  })

  if (!parsed.success) {
    console.error('❌ 인자 파싱에 실패했어요')
    console.error(parsed.error.flatten().fieldErrors)
    console.log('')
    console.log('예시:')
    console.log('  bun tools/listSponsorLabels.ts')
    console.log('  bun tools/listSponsorLabels.ts -- --type artist --view merged')
    console.log('  bun tools/listSponsorLabels.ts -- --type all --view generated --json')
    process.exit(1)
  }

  return parsed.data
}

function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): T {
  const text = readFileSync(filePath, 'utf8')
  const json = JSON.parse(text) as unknown
  return schema.parse(json)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`❌ label 목록 출력 중 오류가 발생했어요: ${message}`)
  process.exit(1)
})
