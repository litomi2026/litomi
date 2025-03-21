import fs from 'fs'
import path from 'path'
import prettier from 'prettier'

type Params = {
  pathname: string
  json: Record<string, unknown>
}

// Prettier를 사용해 JSON 문자열로 포맷팅한 후 파일에 덮어씁니다.
export async function prettifyJSON({ pathname, json }: Params) {
  const filePath = path.resolve(__dirname, pathname)
  const prettierConfig = await prettier.resolveConfig(filePath)

  const formattedJson = await prettier.format(JSON.stringify(json), {
    parser: 'json',
    ...prettierConfig,
  })

  fs.writeFileSync(filePath, formattedJson, 'utf-8')
}
