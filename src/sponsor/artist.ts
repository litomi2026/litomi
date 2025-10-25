import 'server-only'

export type ArtistSponsor = {
  label: string
  value: string
}

const ARTIST_SPONSORS: Record<string, ArtistSponsor[]> = {
  asanagi: [
    {
      label: 'Fantia',
      value: 'https://fantia.jp/fanclubs/1654',
    },
  ],
  quzilax: [
    {
      label: 'X',
      value: 'https://x.com/quzilaxxxx',
    },
  ],
}

export function getArtistSponsors(artistValue: string): ArtistSponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}
