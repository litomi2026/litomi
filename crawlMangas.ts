import type { SpawnOptions } from 'bun'

const spawnOptions: SpawnOptions.OptionsObject = {
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
}

const run = async () => {
  Bun.spawn(['bun', 'run', 'crawl:hasha'], spawnOptions)
  Bun.spawn(['bun', 'run', 'crawl:harpi'], spawnOptions)
}

run()
