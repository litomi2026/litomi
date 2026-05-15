export function getElementBySecureFisherYates<T>(arr: T[]): T {
  const random = getRandomUint32()
  const randomIndex = Math.floor((random / (0xffffffff + 1)) * arr.length)
  return arr[randomIndex]
}

export function getRandomDecimal() {
  const random = getRandomUint32()
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
    const random = getRandomUint32()
    const j = i + Math.floor((random / (0xffffffff + 1)) * (length - i))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, endIndex)
}

function getRandomUint32(): number {
  const crypto = globalThis.crypto

  if (!crypto?.getRandomValues) {
    throw new Error('crypto.getRandomValues is not available in this runtime')
  }

  const [random] = crypto.getRandomValues(new Uint32Array(1))
  return random
}
