import { webcrypto } from 'crypto'

/**
 * 확률 p(0~1)로 true를 반환
 * @param {number} p - 확률
 * @returns {boolean} - 확률에 따른 결과
 */
export function chance(p: number): boolean {
  if (!(p >= 0 && p <= 1)) {
    throw new RangeError('p must be between 0 and 1')
  }

  const u32 = new Uint32Array(1)
  globalThis.crypto.getRandomValues(u32)
  const threshold = Math.floor(p * 0x100000000) // 2^32
  return u32[0] < threshold
}

export function getElementBySecureFisherYates<T>(arr: T[]): T {
  const [random] = webcrypto.getRandomValues(new Uint32Array(1))
  const randomIndex = Math.floor((random / (0xffffffff + 1)) * arr.length)
  return arr[randomIndex]
}

export function getRandomDecimal() {
  const [random] = webcrypto.getRandomValues(new Uint32Array(1))
  return random / (0xffffffff + 1)
}

/**
 * Fisher–Yates 알고리즘을 사용해 배열에서 보안 난수를 이용하여 n개의 무작위 요소를 선택하는 함수
 * @param {Array} arr - 샘플링 대상 배열
 * @param {number} n - 선택할 요소의 개수
 */
export function sampleBySecureFisherYates<T>(arr: T[], n: number = arr.length): T[] {
  const result = arr.slice() // 원본 배열 보호를 위해 복사
  const length = arr.length
  const endIndex = Math.min(n, length)

  for (let i = 0; i < endIndex; i++) {
    const [random] = webcrypto.getRandomValues(new Uint32Array(1))
    const j = i + Math.floor((random / (0xffffffff + 1)) * (length - i))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, endIndex)
}
