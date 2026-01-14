import type { ReactNode } from 'react'

// NOTE: 메시지 렌더링이 "**굵게**" 정도만 필요하면 이 간단 파서로 충분해요.
// NOTE: 링크/리스트/코드블록 등 Markdown 범위가 늘어나면 `react-markdown`(+ `remark-gfm`) 같은 라이브러리로 교체하는 게 더 유지보수하기 좋아요.
export function renderBoldMarkdown(text: string): ReactNode {
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0

  while (cursor < text.length) {
    const open = text.indexOf('**', cursor)
    if (open === -1) {
      nodes.push(text.slice(cursor))
      break
    }

    const close = text.indexOf('**', open + 2)
    if (close === -1) {
      nodes.push(text.slice(cursor))
      break
    }

    if (open > cursor) {
      nodes.push(text.slice(cursor, open))
    }

    const boldText = text.slice(open + 2, close)
    if (boldText.length === 0) {
      // Preserve literals like "****"
      nodes.push(text.slice(open, close + 2))
    } else {
      nodes.push(
        <strong className="font-semibold" key={key}>
          {boldText}
        </strong>,
      )
      key += 1
    }

    cursor = close + 2
  }

  return nodes
}
