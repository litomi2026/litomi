import 'server-only'

import characterSponsorsJSON from './character.json'

type Sponsor = {
  label: string
  value: string
}

const CHARACTER_SPONSORS: Record<string, Sponsor[]> = characterSponsorsJSON

export function getCharacterSponsors(characterValue: string): Sponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}
