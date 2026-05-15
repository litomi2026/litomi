export async function runIsolatedBunTest(fixtureUrl: URL) {
  const proc = Bun.spawn({
    cmd: [process.execPath, 'test', fixtureUrl.pathname, '--isolate', '--max-concurrency', '1'],
    cwd: process.cwd(),
    stderr: 'pipe',
    stdout: 'pipe',
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : '',
    proc.stderr ? new Response(proc.stderr).text() : '',
    proc.exited,
  ])

  if (exitCode !== 0) {
    throw new Error([`Isolated Bun test failed: ${fixtureUrl.pathname}`, stdout, stderr].filter(Boolean).join('\n'))
  }
}
