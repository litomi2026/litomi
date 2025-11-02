import Image from 'next/image'

type Props = {
  className?: string
  priority?: boolean
}

export default function IconLogo({ className, priority }: Readonly<Props>) {
  return <Image alt="logo" className={className} height={512} priority={priority} src="/image/logo.webp" width={512} />
}
