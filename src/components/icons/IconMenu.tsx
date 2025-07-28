import { ComponentProps } from 'react'

export default function IconMenu(props: Readonly<ComponentProps<'svg'>>) {
  return (
    <svg {...props} stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="3" x2="21" y1="12" y2="12"></line>
      <line x1="3" x2="21" y1="6" y2="6"></line>
      <line x1="3" x2="21" y1="18" y2="18"></line>
    </svg>
  )
}
