// https://transform.tools/typescript-to-javascript
// https://hentaipaw.com/
// https://jsonformatter.org/8f087a

function extractArticleId(listHTML: string) {
  // 정규식 패턴 생성
  // a 태그 내부에 fi-kr 클래스를 가진 span이 있는 패턴을 찾음
  const pattern =
    /<a[^>]*href=["']([^"']+)["'][^>]*>(?:(?!<\/a>).)*?<span[^>]*class=["'][^"']*fi-kr[^"']*["'][^>]*>(?:(?!<\/a>).)*?<\/a>/gs

  // href 값을 추출하기 위한 정규식
  const hrefPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/

  // 마지막 숫자를 추출하기 위한 정규식
  const numberPattern = /\/(\d+)(?:[^/\d]*)?$/

  const numbers = []
  let match

  // 모든 일치하는 a 태그 찾기
  while ((match = pattern.exec(listHTML)) !== null) {
    // 찾은 a 태그에서 href 속성 추출
    const hrefMatch = hrefPattern.exec(match[0])
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1]

      // href에서 마지막 숫자 추출
      const numberMatch = numberPattern.exec(href)
      if (numberMatch && numberMatch[1]) {
        numbers.push(parseInt(numberMatch[1], 10))
      }
    }
  }

  return numbers
}

async function fetchMangaImageURLs({ articleId }: { articleId: number | string }) {
  const response = await fetch(`https://hentaipaw.com/viewer?articleId=${articleId}`)
  const viewerHTML = await response.text()
  const urls = getImageURLs(viewerHTML)
  return urls
}

async function fetchMangaList({ page }: { page: number }) {
  const response = await fetch(`https://hentaipaw.com/?page=${page}`)
  const listHTML = await response.text()
  const hrefs = extractArticleId(listHTML)
  return hrefs
}

function getImageURLs(viewerHTML: string) {
  const pattern = /https:\/\/cdn\.imagedeliveries\.com\/\d+\/\w+\/\d+\.webp/g
  const matches = viewerHTML.match(pattern) || []
  return matches
}

const manga: Record<string, string[]> = {}

async function main() {
  for (let page = 1; page < 6; page++) {
    console.log('👀 ~ page:', page)
    const articleIds = await fetchMangaList({ page })
    await sleep(2000)

    for (const articleId of articleIds) {
      const urls = await fetchMangaImageURLs({ articleId })
      manga[articleId] = urls
      await sleep(2000)
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

main()
