import { ImportMode } from './types'

const colors = {
  blue: {
    badge: 'from-blue-600 to-blue-500',
    badgeShadow: 'shadow-blue-600/20',
    bg: 'aria-current:bg-blue-600/10',
    border: 'aria-current:border-blue-600/40',
    gradient: 'from-blue-600/5 to-blue-500/5',
    ring: 'focus-within:ring-blue-500/40',
    shadow: 'aria-current:shadow-blue-600/10',
    warningBg: '',
    warningBorder: '',
    warningText: '',
  },
  orange: {
    badge: '',
    badgeShadow: '',
    bg: 'aria-current:bg-orange-600/10',
    border: 'aria-current:border-orange-600/40',
    gradient: 'from-orange-600/5 to-orange-500/5',
    ring: 'focus-within:ring-orange-500/40',
    shadow: 'aria-current:shadow-orange-600/10',
    warningBg: 'bg-orange-600/10',
    warningBorder: 'border-orange-600/30',
    warningText: 'text-orange-300',
  },
}

type Props = {
  colorScheme: 'blue' | 'orange'
  currentMode: ImportMode
  description: string
  mode: ImportMode
  onChange: (mode: ImportMode) => void
  showBadge?: boolean
  showWarning?: boolean
  title: string
}

export function ImportModeOption({
  colorScheme,
  currentMode,
  description,
  mode,
  onChange,
  showBadge,
  showWarning,
  title,
}: Readonly<Props>) {
  const isSelected = currentMode === mode
  const colorClasses = colors[colorScheme]

  return (
    <label
      aria-current={isSelected}
      className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition overflow-hidden
        ${colorClasses.border} ${colorClasses.bg} ${colorClasses.shadow}
        border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/30 focus-within:ring-2 ${colorClasses.ring} focus-within:ring-offset-2 focus-within:ring-offset-zinc-900`}
    >
      {isSelected && <div className={`absolute inset-0 bg-linear-to-br ${colorClasses.gradient}`} />}
      <input
        checked={isSelected}
        className={`mt-1 w-4 h-4 text-${colorScheme}-600 bg-zinc-800 border-zinc-600 focus:outline-none`}
        name="importMode"
        onChange={(e) => onChange(e.target.value as ImportMode)}
        type="radio"
        value={mode}
      />
      <div className="flex-1 relative space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold leading-7 text-foreground">{title}</p>
          {isSelected && showBadge && colorScheme === 'blue' && (
            <span
              aria-hidden
              className={`text-xs bg-linear-to-r ${colorClasses.badge} whitespace-nowrap text-foreground px-3 py-1.5 rounded-full font-medium shadow-md ${colorClasses.badgeShadow}`}
            >
              권장
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
        {isSelected && showWarning && colorScheme === 'orange' && (
          <div className={`mt-3 p-3 ${colorClasses.warningBg} border ${colorClasses.warningBorder} rounded-xl`}>
            <p className={`text-sm ${colorClasses.warningText} font-medium flex items-start gap-2`}>
              <svg className="w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
              이 작업은 되돌릴 수 없습니다
            </p>
          </div>
        )}
      </div>
    </label>
  )
}
