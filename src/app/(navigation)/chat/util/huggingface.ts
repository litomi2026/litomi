export function normalizeHuggingFaceUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed
  }

  const withoutDomain = trimmed.replace(/^huggingface\.co\//, '')
  return `https://huggingface.co/${withoutDomain}`
}
