import Image from 'next/image'

import logoImage from '@/images/logo.webp'

type Props = {
  className?: string
  priority?: boolean
}

export default function IconLogo({ className, priority }: Readonly<Props>) {
  return <Image alt="logo" className={className} priority={priority} src={logoImage} />
}
