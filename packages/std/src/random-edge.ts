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
