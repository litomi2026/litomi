const MIN_LIBRARY_COLOR_LIGHTNESS = 42
const MAX_LIBRARY_COLOR_LIGHTNESS = 58
const MIN_LIBRARY_COLOR_SATURATION = 58
const MAX_LIBRARY_COLOR_SATURATION = 78

export function getRandomLibraryColor(random = Math.random): string {
  const hue = Math.floor(random() * 360)
  const saturation = randomInteger(MIN_LIBRARY_COLOR_SATURATION, MAX_LIBRARY_COLOR_SATURATION, random)
  const lightness = randomInteger(MIN_LIBRARY_COLOR_LIGHTNESS, MAX_LIBRARY_COLOR_LIGHTNESS, random)

  return hslToHex(hue, saturation, lightness)
}

function getRgbPrime(huePrime: number, chroma: number, x: number): [number, number, number] {
  if (huePrime < 1) {
    return [chroma, x, 0]
  }

  if (huePrime < 2) {
    return [x, chroma, 0]
  }

  if (huePrime < 3) {
    return [0, chroma, x]
  }

  if (huePrime < 4) {
    return [0, x, chroma]
  }

  if (huePrime < 5) {
    return [x, 0, chroma]
  }

  return [chroma, 0, x]
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100)
  const huePrime = hue / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))
  const match = lightness / 100 - chroma / 2
  const [red, green, blue] = getRgbPrime(huePrime, chroma, x)

  return `#${toHexChannel(red + match)}${toHexChannel(green + match)}${toHexChannel(blue + match)}`
}

function randomInteger(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

function toHexChannel(value: number): string {
  const channel = Math.min(255, Math.max(0, Math.round(value * 255)))

  return channel.toString(16).padStart(2, '0')
}
