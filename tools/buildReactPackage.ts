import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { transformFileSync } from '@babel/core'

const packageRootArg = process.argv[2]

if (!packageRootArg) {
  throw new Error('Usage: bun tools/buildReactPackage.ts <package-root>')
}

const packageRoot = resolve(packageRootArg)
const distDir = join(packageRoot, 'dist')
const srcDir = join(packageRoot, 'src')

rmSync(distDir, { force: true, recursive: true })

const tscResult = spawnSync('tsc', ['-p', 'tsconfig.build.json'], {
  cwd: packageRoot,
  env: process.env,
  stdio: 'inherit',
})

if (tscResult.status !== 0) {
  process.exit(tscResult.status ?? 1)
}

for (const file of findFiles(srcDir, '.css')) {
  const outputFile = join(distDir, relative(srcDir, file))

  mkdirSync(dirname(outputFile), { recursive: true })
  copyFileSync(file, outputFile)
}

for (const file of findFiles(distDir, '.js')) {
  const mapFile = `${file}.map`
  const inputSourceMap = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')) : undefined

  const result = transformFileSync(file, {
    babelrc: false,
    configFile: false,
    filename: file,
    inputSourceMap,
    plugins: [['babel-plugin-react-compiler', { target: '19' }]],
    sourceMaps: true,
  })

  if (!result?.code) {
    throw new Error(`React Compiler emitted no code for ${file}`)
  }

  const code = result.code.replace(/^\/\/# sourceMappingURL=.*\n?/gmu, '').trimEnd()

  writeFileSync(file, `${code}\n//# sourceMappingURL=${basename(mapFile)}\n`)

  if (result.map) {
    writeFileSync(mapFile, `${JSON.stringify(result.map)}\n`)
  }
}

function findFiles(dir: string, extension: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      files.push(...findFiles(path, extension))
      continue
    }

    if (path.endsWith(extension)) {
      files.push(path)
    }
  }

  return files
}
