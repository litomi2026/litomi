export type JosaKind = '가' | '로' | '를' | '을' | '은'

// 앞 단어의 받침에 맞춰 조사를 붙임. 을/를 · 이/가 · 은/는 · 로/으로 지원.
export function attachJosa(word: string, josa: JosaKind): string {
  const last = word.trim().slice(-1)
  const code = last.charCodeAt(0)
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const jong = isHangul ? (code - 0xac00) % 28 : 0
  const hasBatchim = isHangul && jong !== 0
  const isRieul = jong === 8

  switch (josa) {
    case '을':
    case '를':
      return word + (hasBatchim ? '을' : '를')
    case '가':
      return word + (hasBatchim ? '이' : '가')
    case '은':
      return word + (hasBatchim ? '은' : '는')
    case '로':
      return word + (hasBatchim && !isRieul ? '으로' : '로')
    default:
      return word + josa
  }
}
