/* eslint-disable @next/next/no-img-element */
'use client'

type Props = {
  src: string
}

export default function CoverImageViewer({ src }: Props) {
  return (
    <img
      alt="manga-image"
      className="object-contain aspect-[3/4]"
      height={1536}
      referrerPolicy="no-referrer"
      src={src}
      width={1536}
    />
  )
}
