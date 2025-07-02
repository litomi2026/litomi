import type { SpawnOptions } from 'bun'

const spawnOptions = {
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
} satisfies SpawnOptions.OptionsObject<'inherit', 'inherit', 'inherit'>

const run = async () => {
  Bun.spawn(['bun', 'run', 'crawl:harpi'], spawnOptions)
}

run()
