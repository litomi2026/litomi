export const MyMath = {
  random(min: number, max: number): number {
    return Math.random() * (max - min) + min
  },

  randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  },

  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  },

  pointDist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  },

  pointAngle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1)
  },
}
