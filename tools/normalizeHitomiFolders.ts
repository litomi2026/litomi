import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

type Options = {
  apply: boolean
  outDir: string
}

type PlannedAction =
  | {
      kind: 'empty-alias'
      path: string
      reason: string
    }
  | {
      kind: 'rename-alias-and-empty'
      path: string
      target: string
    }
  | {
      kind: 'rename-canonical'
      path: string
      target: string
    }
  | {
      kind: 'skip'
      path: string
      reason: string
    }

const defaultOutDir = 'downloads/hitomi'

const usage = () => {
  console.log(`Usage:
  bun tools/normalizeHitomiFolders.ts [options]

Options:
  --out <dir>   Hitomi download directory. Default: ${defaultOutDir}
  --apply       Apply changes. Without this, only prints a dry-run plan.
  --help        Show this help.

Behavior:
  123-456-title -> 123-456, then empties 123-456 because it is an alias folder.
  123-456       keeps the folder but deletes its contents.
  123-title     -> 123, preserving contents because it is a canonical folder.
`)
}

const takeValue = (args: string[], index: number, name: string) => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

const parseArgs = (args: string[]): Options => {
  const options: Options = {
    apply: false,
    outDir: defaultOutDir,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else if (arg === '--out') {
      options.outDir = takeValue(args, i, '--out')
      i++
    } else if (arg === '--apply') {
      options.apply = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return options
}

const removeChildren = async (path: string) => {
  const entries = await readdir(path, { withFileTypes: true })
  await Promise.all(entries.map((entry) => rm(join(path, entry.name), { force: true, recursive: true })))
  return entries.length
}

const pathExists = async (path: string) => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const readDirectoryNames = async (outDir: string) => {
  try {
    const entries = await readdir(outDir, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Output directory does not exist: ${outDir}`)
    }
    throw error
  }
}

const planForFolder = (outDir: string, name: string, names: Set<string>): PlannedAction | undefined => {
  const aliasWithTitle = /^(\d+)-(\d+)-(.+)$/.exec(name)
  if (aliasWithTitle) {
    return {
      kind: 'rename-alias-and-empty',
      path: join(outDir, name),
      target: join(outDir, `${aliasWithTitle[1]}-${aliasWithTitle[2]}`),
    }
  }

  if (/^\d+-\d+$/.test(name)) {
    return {
      kind: 'empty-alias',
      path: join(outDir, name),
      reason: 'alias folder should not keep downloaded files',
    }
  }

  const canonicalWithTitle = /^(\d+)-(.+)$/.exec(name)
  if (!canonicalWithTitle) {
    return undefined
  }

  const targetName = canonicalWithTitle[1]
  if (names.has(targetName)) {
    return {
      kind: 'skip',
      path: join(outDir, name),
      reason: `canonical target already exists: ${join(outDir, targetName)}`,
    }
  }

  return {
    kind: 'rename-canonical',
    path: join(outDir, name),
    target: join(outDir, targetName),
  }
}

const printAction = (action: PlannedAction, apply: boolean) => {
  const prefix = apply ? 'apply' : 'dry-run'
  if (action.kind === 'empty-alias') {
    console.log(`[${prefix}] empty ${action.path} (${action.reason})`)
  } else if (action.kind === 'rename-alias-and-empty') {
    console.log(`[${prefix}] rename ${action.path} -> ${action.target}, then empty`)
  } else if (action.kind === 'rename-canonical') {
    console.log(`[${prefix}] rename ${action.path} -> ${action.target}`)
  } else {
    console.log(`[${prefix}] skip ${action.path} (${action.reason})`)
  }
}

const applyAction = async (action: PlannedAction) => {
  if (action.kind === 'empty-alias') {
    const removed = await removeChildren(action.path)
    return removed
  }

  if (action.kind === 'rename-alias-and-empty') {
    const targetExists = await pathExists(action.target)
    if (targetExists) {
      await removeChildren(action.path)
      await rm(action.path, { force: true, recursive: true })
    } else {
      await rename(action.path, action.target)
    }
    const removed = await removeChildren(action.target)
    return removed
  }

  if (action.kind === 'rename-canonical') {
    await mkdir(dirname(action.target), { recursive: true })
    await rename(action.path, action.target)
  }

  return 0
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const outDir = resolve(options.outDir)
  const names = await readDirectoryNames(outDir)
  const nameSet = new Set(names)
  const actions = names
    .map((name) => planForFolder(outDir, name, nameSet))
    .filter((action): action is PlannedAction => Boolean(action))

  if (!actions.length) {
    console.log(`No folders to normalize in ${outDir}`)
    return
  }

  let emptiedEntries = 0
  let renamed = 0
  let skipped = 0

  for (const action of actions) {
    printAction(action, options.apply)
    if (action.kind === 'skip') {
      skipped++
      continue
    }

    if (action.kind === 'rename-alias-and-empty' || action.kind === 'rename-canonical') {
      renamed++
    }

    if (options.apply) {
      emptiedEntries += await applyAction(action)
    }
  }

  console.log(
    `${options.apply ? 'complete' : 'dry-run complete'}: actions=${actions.length}, renamed=${renamed}, skipped=${skipped}, emptied entries=${emptiedEntries}`,
  )

  if (!options.apply) {
    console.log('Pass --apply to make these changes.')
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
