import { ComponentProps } from 'react'

export default function IconDot(props: Readonly<ComponentProps<'svg'>>) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}
