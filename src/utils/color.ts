export function hexColorToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

export function intToHexColor(color: number | null) {
  return color !== null ? `#${color.toString(16).padStart(6, '0').toUpperCase()}` : null
}
