import { prettifyJSON } from '../crawler/utils'
import mangas from '../database/harpi.json'

prettifyJSON({ pathname: '../database/harpi.json', json: { ...mangas } })
