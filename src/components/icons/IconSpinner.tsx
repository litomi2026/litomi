import { ComponentProps } from 'react'

export default function IconSpinner({ className = '', ...props }: ComponentProps<'svg'>) {
  return (
    <svg {...props} className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  )
}
