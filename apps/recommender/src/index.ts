import { runGenerate } from './generate'
import { log } from './log'
import { runSyncIndex } from './sync-index'

const COMMANDS = {
  generate: runGenerate,
  'sync-index': runSyncIndex,
} satisfies Record<string, (argv: string[]) => Promise<void>>

type CommandName = keyof typeof COMMANDS

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log.error('fatal error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    process.exit(1)
  })

async function main() {
  const [command, ...argv] = process.argv.slice(2)

  if (!command || !isCommandName(command)) {
    throw new Error(`Usage: recommender <${Object.keys(COMMANDS).join('|')}> [options]`)
  }

  await COMMANDS[command](argv)
}

function isCommandName(value: string): value is CommandName {
  return value in COMMANDS
}
