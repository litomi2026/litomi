export function checkDefined<T>(arg: T | null | undefined): arg is T {
  return arg !== undefined || arg !== null
}
