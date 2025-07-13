import { prettifyJSON } from '../src/crawler/utils'
import mangas from '../src/database/harpi.json'

prettifyJSON({ pathname: '../database/harpi.json', json: { ...mangas } })
