import { writeFileSync } from 'fs'
import { join } from 'path'

type HarpiAttributesResponse = {
  data: {
    tags: Tag[]
  }
}

type Tag = {
  id: string
  engStr: string
  korStr: string
  gender: string
  isVisible: boolean
}

async function crawlHarpiTags() {
  const response = await fetch('https://harpi.in/animation/attributes', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      referer: 'https://harpi.in/',
    },
  })
  const data = (await response.json()) as HarpiAttributesResponse
  const tagsMap = Object.fromEntries(data.data.tags.map((tag) => [tag.id, { ko: tag.korStr, en: tag.engStr }]))
  const outputPath = join(process.cwd(), 'src', 'database', 'harpi-tag.json')

  writeFileSync(outputPath, JSON.stringify(tagsMap))

  console.log(`✅ ${Object.keys(tagsMap).length}개의 태그를 ${outputPath}에 저장했어요`)
}

crawlHarpiTags().catch((error) => {
  console.error('❌ Harpi 태그 크롤링 중 오류 발생:', error)
  process.exit(1)
})
