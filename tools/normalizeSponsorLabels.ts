import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { z } from 'zod'

type SponsorLink = {
  label: string
  value: string
}

type SponsorsMap = Record<string, SponsorLink[]>

const SponsorLinkSchema: z.ZodType<SponsorLink> = z.object({
  label: z.string(),
  value: z.string(),
})

const SponsorsMapSchema: z.ZodType<SponsorsMap> = z.record(z.string(), z.array(SponsorLinkSchema))

const ArgsSchema = z.object({
  file: z.string().default('src/sponsor/artist.json'),
  write: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  json: z.boolean().default(false),
})

type Args = z.infer<typeof ArgsSchema>

type Change = {
  key: string
  from: string
  to: string
  url: string
}

function defaultLabelFromUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'amazon.co.jp' || host.endsWith('.amazon.co.jp')) return 'Amazon'
    if (host === 'animenewsnetwork.com') return 'AnimeNewsNetwork'
    if (host === 'coolier.net') return 'Coolier'
    if (host === 'deviantart.com' || host.endsWith('.deviantart.com')) return 'DeviantArt'
    if (host === 'geocities.co.jp' || host === 'geocities.jp') return 'Geocities'
    if (host === 'bsky.app') return 'Bluesky'
    if (host === 'coconala.com') return 'Coconala'
    if (host === 'dlsite.com') return 'DLsite'
    if (host === 'dmm.co.jp' || host.endsWith('.dmm.co.jp')) return 'DMM'
    if (host === 'erogamescape.dyndns.org') return 'Erogamescape'
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'Instagram'
    if (host === 'lofter.com') return 'Lofter'
    if (host === 'mangaupdates.com') return 'MangaUpdates'
    if (host === 'melonbooks.co.jp') return 'Melonbooks'
    if (host === 'mujin-ti.net') return 'MujinTi'
    if (host === 'myanimelist.net') return 'MyAnimeList'
    if (host === 'nicovideo.jp' || host.endsWith('.nicovideo.jp')) return 'Niconico'
    if (host === 'nijie.info') return 'Nijie'
    if (host === 'tegaki.pipa.jp') return 'TegakiPipa'
    if (host === 'tinami.com') return 'Tinami'
    if (host === 'profcard.info') return 'Profcard'
    if (host === 'reddit.com' || host.endsWith('.reddit.com')) return 'Reddit'
    if (host === 'skeb.jp') return 'Skeb'
    if (host === 'tumblr.com' || host.endsWith('.tumblr.com')) return 'Tumblr'
    if (host === 'xfolio.jp') return 'Xfolio'
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com'))
      return 'X'
    if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) return 'YouTube'
    if (host.endsWith('.pixiv.net')) return 'Pixiv'
    if (host === 'pixiv.net') {
      if (u.pathname.startsWith('/fanbox')) return 'Fanbox'
      return 'Pixiv'
    }
    if (host.endsWith('.fanbox.cc') || host === 'fanbox.cc') return 'Fanbox'
    if (host === 'fantia.jp') return 'Fantia'
    if (host === 'patreon.com') return 'Patreon'
    if (host === 'ko-fi.com') return 'Ko-fi'
    if (host === 'gumroad.com' || host.endsWith('.gumroad.com')) return 'Gumroad'
    if (host === 'booth.pm') return 'BOOTH'
    if (host === 'buymeacoffee.com') return 'BuyMeACoffee'
    if (host === 'baraag.net') return 'Baraag'
    if (host === 'blog.naver.com' || host.endsWith('.blog.naver.com')) return 'Naver'
    if (host === 'ec.toranoana.jp' || host === 'toranoana.jp' || host.endsWith('.toranoana.jp')) return 'Toranoana'
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'TikTok'
    if (host === 'fc2.com' || host.endsWith('.fc2.com')) return 'FC2'
    if (host === 'linktr.ee') return 'Linktree'

    return host
  } catch {
    return 'Link'
  }
}

function isHostLikeLabel(label: string) {
  // e.g. instagram.com, myanimelist.net, 8318486996332.gumroad.com
  // Keep labels like "Pixiv 404" as-is (it contains a space).
  return label.includes('.') && !label.includes(' ')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const filePath = resolve(process.cwd(), args.file)

  const map = readJsonFile(filePath, SponsorsMapSchema)

  let totalLinks = 0
  const changes: Change[] = []

  for (const [key, links] of Object.entries(map)) {
    for (const link of links) {
      totalLinks += 1
      const next = normalizeLabelForUrl(link.label, link.value)
      if (next !== link.label) {
        changes.push({ key, from: link.label, to: next, url: link.value })
        link.label = next
      }
    }
  }

  const result = {
    file: args.file,
    totalLinks,
    changedLinks: changes.length,
    dryRun: args.dryRun || !args.write,
    changesPreview: changes.slice(0, 50),
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`—`)
    console.log(`🧹 파일: ${args.file}`)
    console.log(`🔗 링크: ${totalLinks.toLocaleString()}개`)
    console.log(`✏️  변경: ${changes.length.toLocaleString()}개`)
    if (result.dryRun) {
      console.log(`🧯 dry-run: 파일에 쓰지 않아요`)
    }
    if (changes[0]) {
      console.log('—')
      console.log('예시(최대 10개):')
      for (const c of changes.slice(0, 10)) {
        console.log(`- ${c.key}: ${c.from} → ${c.to} (${c.url})`)
      }
    }
    console.log(`—`)
  }

  if (!result.dryRun) {
    writeJsonFile(filePath, map)
  }
}

function normalizeLabelForUrl(currentLabel: string, url: string) {
  const label = currentLabel.trim()
  const canonical = defaultLabelFromUrl(url)

  if (!label) {
    return canonical
  }

  // pixiv.net/fanbox/* or *.fanbox.cc should always be Fanbox
  if (label === 'Pixiv' && canonical === 'Fanbox') {
    return 'Fanbox'
  }

  if (isHostLikeLabel(label)) {
    return canonical
  }

  return label
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
    file: typeof raw.file === 'string' ? raw.file : undefined,
    write: raw.write === true,
    dryRun: raw['dry-run'] === true || raw.dryRun === true,
    json: raw.json === true,
  })

  if (!parsed.success) {
    console.error('❌ 인자 파싱에 실패했어요')
    console.error(parsed.error.flatten().fieldErrors)
    console.log('')
    console.log('예시:')
    console.log('  bun tools/normalizeSponsorLabels.ts')
    console.log('  bun tools/normalizeSponsorLabels.ts -- --file src/sponsor/artist.json --write')
    console.log('  bun tools/normalizeSponsorLabels.ts -- --file src/sponsor/artist.json --dry-run --json')
    process.exit(1)
  }

  return parsed.data
}

function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): T {
  const text = readFileSync(filePath, 'utf8')
  const json = JSON.parse(text) as unknown
  return schema.parse(json)
}

function writeJsonFile(filePath: string, data: unknown) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`❌ label 정규화 중 오류가 발생했어요: ${message}`)
  process.exit(1)
})
