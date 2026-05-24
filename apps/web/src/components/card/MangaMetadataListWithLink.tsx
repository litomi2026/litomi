import { LabeledValue } from '@litomi/domain/manga/model'
import { ExternalLink } from 'lucide-react'

import MangaMetadataLink from './MangaMetadataLink'

type MangaMetadataWithLink = {
  label: string
  value: string
  links?: LabeledValue[]
}

type Props = {
  filterType: string
  items: MangaMetadataWithLink[]
  searchParams?: string
}

const MAX_LABEL_LENGTH = 8

export default function MangaMetadataListWithLink({ filterType, items, searchParams }: Props) {
  return (
    <ul className="break-all">
      {items.map(({ value, label, links }, i) => (
        <li className="inline" key={value}>
          <MangaMetadataLink filterType={filterType} i={i} label={label} searchParams={searchParams} value={value} />
          {links && (
            <span className="inline">
              <a
                className="inline p-1 py-0.5 rounded text-zinc-400 hover:text-brand hover:bg-brand/10 hover:underline transition"
                href={links[0].value}
                rel="noopener"
                target="_blank"
                title={`${label || value}의 ${links[0].label} 후원하기`}
              >
                <span className="text-xs font-medium">
                  {links[0].label.slice(0, MAX_LABEL_LENGTH)}
                  {links[0].label.length > MAX_LABEL_LENGTH ? '..' : ''}
                </span>
                <ExternalLink className="inline size-3 shrink-0 ml-0.5" />
              </a>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
