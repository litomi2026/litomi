import logoImage from '@/images/logo.webp'
import Image from 'next/image'

type Props = {
  className?: string
  priority?: boolean
}

export default function IconLogo({ className, priority }: Props) {
  return <Image alt="로고" className={className} priority={priority} src={logoImage} />
}
