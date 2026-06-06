const UINT32_RANGE = 0x100000000

export function getElementBySecureFisherYates<T>(arr: T[]): T {
  const randomIndex = arr.length === 0 ? 0 : getRandomInt(arr.length)
  return arr[randomIndex]
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
    const j = i + getRandomInt(length - i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, endIndex)
}

function getRandomInt(max: number): number {
  const limit = UINT32_RANGE - (UINT32_RANGE % max)
  let random = getRandomUint32()

  while (random >= limit) {
    random = getRandomUint32()
  }

  return random % max
}

function getRandomUint32(): number {
  const [random] = globalThis.crypto.getRandomValues(new Uint32Array(1))
  return random
}
