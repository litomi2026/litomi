import { ExternalLink } from 'lucide-react'
import { Suspense } from 'react'

import { LabeledValue } from '@/types/manga'

import MangaMetadataLink from './MangaMetadataLink'

type MangaMetadataWithLink = {
  label: string
  value: string
  links?: LabeledValue[]
}

type Props = {
  filterType: string
  items: MangaMetadataWithLink[]
}

export default function MangaMetadataListWithLink({ filterType, items }: Props) {
  return (
    <ul className="break-all">
      {items.map(({ value, label, links }, i) => (
        <li className="inline" key={value}>
          <Suspense>
            <MangaMetadataLink filterType={filterType} i={i} label={label} value={value} />
          </Suspense>
          {links && (
            <span className="inline">
              {links.map((link, index) => (
                <a
                  className="inline p-1 py-0.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition"
                  href={link.value}
                  key={index}
                  rel="noopener"
                  target="_blank"
                  title={`${label}의 ${link.label} 후원하기`}
                >
                  <ExternalLink className="inline size-3 flex-shrink-0" />
                  <span className="text-xs font-medium ml-0.5">{link.label}</span>
                </a>
              ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
