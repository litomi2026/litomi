import { ReactNode } from 'react'

const colors = {
  error: {
    bg: 'from-red-600/10 to-red-500/5',
    border: 'border-red-600/20',
    text: 'text-red-400',
  },
  success: {
    bg: 'from-emerald-600/10 to-emerald-500/5',
    border: 'border-emerald-600/20',
    text: 'text-emerald-400',
  },
  warning: {
    bg: 'from-amber-600/10 to-amber-500/5',
    border: 'border-amber-600/20',
    text: 'text-amber-400',
  },
}

type Props = {
  children?: ReactNode
  count: number
  label: string
  type: 'error' | 'success' | 'warning'
}

export function ResultCard({ children, count, label, type }: Props) {
  const colorClasses = colors[type]

  return (
    <div
      className={`flex items-center justify-between p-4 bg-gradient-to-r ${colorClasses.bg} rounded-xl border ${colorClasses.border}`}
    >
      <span className="font-medium text-zinc-200">{label}</span>
      <span className={`font-bold ${colorClasses.text} text-lg`}>{count.toLocaleString()}개</span>
      {children}
    </div>
  )
}
