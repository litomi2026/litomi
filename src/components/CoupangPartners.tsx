type Props = {
  className?: string
}

export default function CoupangPartners({ className = '' }: Props) {
  return (
    <a
      className={`hover:underline ${className}`}
      href="https://velog.io/@gwak2837/%EC%A0%9C%EC%A3%BC-%EC%82%BC%EB%8B%A4%EC%88%98"
      target="_blank"
    >
      쿠팡 파트너스
    </a>
  )
}
