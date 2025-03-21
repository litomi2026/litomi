import mangas from '../database/manga.json'
import { prettifyJSON } from './utils'

prettifyJSON({ pathname: '../database/manga.json', json: { ...mangas } })
