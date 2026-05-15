type ByteUnitSystem = 'iec' | 'si'

type FormatBytesOptions = {
  /**
   * - si: 1000-based units (kB/MB/GB...)
   * - iec: 1024-based units (KiB/MiB/GiB...)
   */
  system?: ByteUnitSystem
  /**
   * Fraction digits for non-bytes units. Defaults to 1.
   * (Bytes always use 0 fraction digits.)
   */
  fractionDigits?: number
}

export function formatBytes(bytes: number, options?: FormatBytesOptions): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0B'
  }

  const system: ByteUnitSystem = options?.system ?? 'si'
  const base = system === 'si' ? 1000 : 1024
  const fractionDigits = options?.fractionDigits ?? 1

  const units =
    system === 'si'
      ? (['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB'] as const)
      : (['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'] as const)

  let value = bytes
  let unitIndex = 0

  while (value >= base && unitIndex < units.length - 1) {
    value /= base
    unitIndex += 1
  }

  const rounded = unitIndex === 0 ? Math.round(value) : Math.round(value * 10 ** fractionDigits) / 10 ** fractionDigits

  return `${rounded}${units[unitIndex]}`
}
