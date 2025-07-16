export type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>

export function checkDefined<T>(arg: T | null | undefined): arg is T {
  return arg !== undefined && arg !== null
}
