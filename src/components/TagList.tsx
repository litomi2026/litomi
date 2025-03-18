import { memo } from 'react'

const tagStyles = {
  male: 'bg-blue-700',
  female: 'bg-red-700',
  남: 'bg-blue-700',
  여: 'bg-red-700',
}

type Props = {
  className: string
  tags: string[]
}

export default memo(TagList)

function TagList({ className, tags }: Props) {
  return (
    <ul className={className}>
      {tags.map((tag) => {
        const [category, label] = tag.split(':')
        const tagStyle = tagStyles[category as keyof typeof tagStyles] ?? 'bg-zinc-700'
        return (
          <li className={tagStyle} key={tag}>
            {label || category}
          </li>
        )
      })}
    </ul>
  )
}
