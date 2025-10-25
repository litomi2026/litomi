import 'server-only'

export type CharacterSponsor = {
  label: string
  value: string
}

const CHARACTER_SPONSORS: Record<string, CharacterSponsor[]> = {
  shirakami_fubuki: [
    {
      label: 'YouTube',
      value: 'https://www.youtube.com/@shirakamifubuki',
    },
  ],
}

export function getCharacterSponsors(characterValue: string): CharacterSponsor[] | undefined {
  return CHARACTER_SPONSORS[characterValue]
}
