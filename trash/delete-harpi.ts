import * as fs from 'fs'

const originalFilePath = './src/database/manga.json'
const newFilePath = './src/database/harpi-manga.json'

// 원본 파일 읽기
const fileData = fs.readFileSync(originalFilePath, 'utf8')
interface MangaItem {
  [key: string]: unknown
  cdn?: string
}

const data: Record<string, MangaItem> = JSON.parse(fileData)

// "cdn": "HARPI" 항목만 추출하고 원본 데이터에서 삭제
const harpiItems: Record<string, unknown> = {}

for (const key in data) {
  if (Object.prototype.hasOwnProperty.call(data, key)) {
    const item = data[key]
    if (item.cdn === 'HARPI') {
      harpiItems[key] = item
      delete data[key]
    }
  }
}

// 원본 파일에 업데이트된 데이터 저장
fs.writeFileSync(originalFilePath, JSON.stringify(data, null, 2), 'utf8')

// 분리한 항목들을 새 파일에 저장
fs.writeFileSync(newFilePath, JSON.stringify(harpiItems, null, 2), 'utf8')

console.log('데이터 분리 완료: 원본 파일과 새로운 파일이 업데이트되었습니다.')
