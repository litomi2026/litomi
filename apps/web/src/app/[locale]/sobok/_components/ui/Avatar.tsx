import { twMerge } from 'tailwind-merge'
import { avatarURL } from '../../_lib/chat'

interface Props {
  name: string
  imageURL: string | null | undefined
  alt?: string
  className?: string
}

export default function Avatar({ name, imageURL, alt = '', className }: Props) {
  return (
    <img
      alt={alt}
      src={avatarURL(name, imageURL)}
      className={twMerge('h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-foreground/10', className)}
    />
  )
}
