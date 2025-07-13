import Image from 'next/image'

import logoImage from '@/images/logo.webp'

type Props = {
  className?: string
  priority?: boolean
}

export default function IconLogo({ className, priority }: Readonly<Props>) {
  return <Image alt="로고" className={className} priority={priority} src={logoImage} />
}
