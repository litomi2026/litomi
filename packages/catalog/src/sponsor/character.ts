import 'server-only'

import type { Sponsor, SponsorMap } from './common'

import characterSponsorsJSON from './character.json'

const CHARACTER_SPONSORS = characterSponsorsJSON as SponsorMap

export function getCharacterSponsors(characterValue: string): Sponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}
