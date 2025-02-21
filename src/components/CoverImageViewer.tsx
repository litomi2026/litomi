/* eslint-disable @next/next/no-img-element */
'use client'

type Props = {
  src: string
}

export default function CoverImageViewer({ src }: Props) {
  return (
    <img
      alt="manga-image"
      width={1536}
      height={1536}
      className="object-contain aspect-[3/4]"
      referrerPolicy="no-referrer"
      src={src}
    />
  )
}
