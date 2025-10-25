import { ExternalLink } from 'lucide-react'
import { Suspense } from 'react'

import { ArtistWithSponsor } from '@/types/manga'

import MangaMetadataLink from './MangaMetadataLink'

type Props = {
  artists: ArtistWithSponsor[]
}

export default function ArtistMetadataList({ artists }: Props) {
  return (
    <ul className="break-all">
      {artists.map(({ value, label, sponsors }, i) => (
        <li className="inline-flex items-center flex-nowrap" key={value}>
          <Suspense>
            <MangaMetadataLink filterType="artist" i={i} label={label} value={value} />
          </Suspense>
          {sponsors && (
            <span className="inline-flex items-center gap-1">
              {sponsors.map((sponsor, index) => (
                <a
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition"
                  href={sponsor.url}
                  key={index}
                  rel="noopener"
                  target="_blank"
                  title={`${label}의 ${sponsor.platform} 후원하기`}
                >
                  <ExternalLink className="size-3" />
                  <span className="text-xs font-medium">{sponsor.platform}</span>
                </a>
              ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
