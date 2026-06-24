import 'server-only'

import characterSponsorsJSON from './character.json'
import type { Sponsor, SponsorMap } from './common'

const CHARACTER_SPONSORS = characterSponsorsJSON as SponsorMap

export function getCharacterSponsors(characterValue: string): Sponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}
