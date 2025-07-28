import { ComponentProps } from 'react'

export default function IconPen(props: Readonly<ComponentProps<'svg'>>) {
  return (
    <svg
      {...props}
      aria-label="글쓰기"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="4" x2="4" y1="3" y2="7" />
      <line x1="2" x2="6" y1="5" y2="5" />
      <path d="M11 20h11" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19H4v-3L16.5 3.5z" />
    </svg>
  )
}
