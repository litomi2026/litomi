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

const MAX_LABEL_LENGTH = 8

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
                  className="inline p-1 py-0.5 rounded text-zinc-400 hover:text-brand hover:bg-brand/10 hover:underline transition"
                  href={link.value}
                  key={index}
                  rel="noopener"
                  target="_blank"
                  title={`${label || value}의 ${link.label} 후원하기`}
                >
                  <span className="text-xs font-medium">
                    {link.label.slice(0, MAX_LABEL_LENGTH)}
                    {link.label.length > MAX_LABEL_LENGTH ? '..' : ''}
                  </span>
                  <ExternalLink className="inline size-3 shrink-0 ml-0.5" />
                </a>
              ))}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
