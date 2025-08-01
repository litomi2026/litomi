import { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  title: string
  description: string
  variant?: 'danger' | 'default'
  children: ReactNode
}

export default function CollapsibleSection({
  icon,
  title,
  description,
  variant = 'default',
  children,
}: Readonly<Props>) {
  const borderColor = variant === 'danger' ? 'border-red-900/50' : 'border-zinc-800'
  const titleColor = variant === 'danger' ? 'text-red-500' : ''
  const contentBorderColor = variant === 'danger' ? 'border-red-900/50' : 'border-zinc-800'

  return (
    <details className={`bg-zinc-900 border-2 ${borderColor} rounded-xl overflow-hidden group`}>
      <summary className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-zinc-800/50 transition">
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-left">
            <h2 className={`text-lg font-semibold ${titleColor}`}>{title}</h2>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        <svg
          className="w-5 text-zinc-400 transition group-open:rotate-180 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        </svg>
      </summary>

      <div className={`px-6 pb-6 border-t ${contentBorderColor}`}>{children}</div>
    </details>
  )
}
