import fs from 'fs'

async function checkRequiredEnvVars(templatePath: string = './.env.template') {
  if (!fs.existsSync(templatePath)) {
    console.error(`.env.template 파일을 찾을 수 없습니다: ${templatePath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(templatePath, 'utf-8')
  const lines = content.split('\n')

  const missingKeys: string[] = []

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return // 빈 줄이거나 주석(#)인 경우 무시

    const equalIndex = trimmed.indexOf('=')
    if (equalIndex === -1) return // 유효하지 않은 형식은 무시

    const key = trimmed.slice(0, equalIndex).trim()
    const value = trimmed.slice(equalIndex + 1).trim()

    // 값이 있다면 필수 항목으로 간주
    if (value !== '' && !process.env[key]) {
      missingKeys.push(key)
    }
  })

  if (missingKeys.length > 0) {
    const missingKeysStr = missingKeys.join('\n  - ')
    console.error(`런타임 필수 환경 변수가 누락되었습니다:\n  - ${missingKeysStr}\n`)
  }
}

checkRequiredEnvVars()
