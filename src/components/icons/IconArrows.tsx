import { ComponentProps } from 'react'

export function IconFirstPage(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M18 6L10 12L18 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M6 6V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconJumpNext(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M7 6L13 12L7 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconJumpPrev(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M17 6L11 12L17 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M11 6L5 12L11 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconLastPage(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M6 6L14 12L6 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 6V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconNextPage(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

export function IconPrevPage(props: ComponentProps<'svg'>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}
