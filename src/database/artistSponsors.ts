import 'server-only'

export type ArtistSponsor = {
  platform: string
  url: string
}

const ARTIST_SPONSORS: Record<string, ArtistSponsor[]> = {
  asanagi: [
    {
      platform: 'Fantia',
      url: 'https://fantia.jp/fanclubs/1654',
    },
  ],
  quzilax: [
    {
      platform: 'X',
      url: 'https://x.com/quzilaxxxx',
    },
  ],
}

export function getArtistSponsors(artistValue: string): ArtistSponsor[] | undefined {
  return ARTIST_SPONSORS[artistValue]
}
