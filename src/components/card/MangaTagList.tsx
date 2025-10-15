import { MangaTag } from '@/types/manga'

import MangaTagLink from './MangaTagLink'

type Props = {
  className?: string
  tags: MangaTag[]
}

export default function MangaTagList({ className = '', tags }: Readonly<Props>) {
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map(({ category, value, label }) => (
        <MangaTagLink category={category} key={`${category}:${value}`} label={label} value={value} />
      ))}
    </ul>
  )
}
