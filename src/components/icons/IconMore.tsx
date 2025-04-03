import { ComponentProps } from 'react'

export default function IconMore(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}
