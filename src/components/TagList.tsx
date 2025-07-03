import Link from 'next/link'
import { memo } from 'react'

import { getSearchLink } from './card/utils'

const tagStyles = {
  male: 'bg-blue-700',
  female: 'bg-red-700',
  남: 'bg-blue-700',
  여: 'bg-red-700',
  mixed: 'bg-purple-700',
  혼합: 'bg-purple-700',
  other: 'bg-zinc-700',
  기타: 'bg-zinc-700',
}

type Props = {
  className: string
  tags: string[]
  clickable?: boolean
}

export default memo(TagList)

function TagList({ className, tags, clickable = false }: Props) {
  return (
    <ul className={className}>
      {tags.map((tag) => {
        const [category, label] = tag.split(':')
        const tagStyle = label ? (tagStyles[category as keyof typeof tagStyles] ?? 'bg-zinc-900') : 'bg-zinc-700'
        const content = (label || category).replaceAll('_', ' ')

        if (clickable) {
          return (
            <li className={`${tagStyle} hover:opacity-80 focus:opacity-80 transition-opacity`} key={tag}>
              <Link className="block" href={getSearchLink(label ? category : 'other', content)}>
                {content}
              </Link>
            </li>
          )
        }

        return (
          <li className={tagStyle} key={tag}>
            {content}
          </li>
        )
      })}
    </ul>
  )
}
