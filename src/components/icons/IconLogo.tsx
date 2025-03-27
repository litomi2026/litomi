import logoImage from '@/images/logo.webp'
import Image from 'next/image'

type Props = {
  className?: string
}

export default function IconLogo({ className }: Props) {
  return <Image alt="로고" className={className} src={logoImage} />
}
