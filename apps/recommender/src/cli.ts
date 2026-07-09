export type FlagValues = Map<string, string>

export function parseFlags(argv: string[], allowedKeys: readonly string[]): FlagValues {
  const allowed = new Set(allowedKeys)
  const flags: FlagValues = new Map()

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]

    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`)
    }

    const [key, inlineValue] = arg.slice(2).split('=', 2)

    if (!allowed.has(key)) {
      throw new Error(`Unknown option: --${key}`)
    }

    const value = inlineValue ?? argv[++index]

    if (value === undefined) {
      throw new Error(`Missing value for --${key}`)
    }

    flags.set(key, value)
  }

  return flags
}

export function parsePositiveInteger(name: string, value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`--${name} must be a positive integer`)
  }

  return parsed
}

export function parseRatio(name: string, value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`--${name} must be a number between 0 and 1`)
  }

  return parsed
}
