'use client'

import type { TPost } from '@/mock/post'

const containerStyle: Record<number, string> = {
  0: '',
  1: 'w-fit',
  2: 'aspect-video grid-cols-2',
  3: 'aspect-video grid-cols-2 grid-rows-2',
  4: 'aspect-video grid-cols-2 grid-rows-2',
}

const imageStyle: Record<number, string> = {
  0: '',
  1: 'w-fit',
  2: 'aspect-video',
  3: 'aspect-video first-of-type:row-span-full',
  4: 'aspect-video',
}

type Props = {
  className?: string
  urls: string[]
  initialPost: TPost
}

export default function PostImages({ className = '', urls }: Readonly<Props>) {
  const postImageURLs = urls.slice(0, 4)
  const length = postImageURLs.length

  return (
    <div
      className={`grid cursor-pointer gap-0.5 ${containerStyle[length]} ${className}`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {postImageURLs.map((url, i) => (
        <img
          alt="post-image"
          className={`h-full object-cover bg-zinc-800 ${imageStyle[length]}`}
          key={i}
          onLoad={(e) => (e.target as HTMLImageElement).classList.remove('animate-pulse')}
          src={url}
        />
      ))}
    </div>
  )
}
