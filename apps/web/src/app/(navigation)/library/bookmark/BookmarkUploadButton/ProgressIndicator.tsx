export const STEP_MAP = {
  idle: {
    label: '파일 선택',
    step: 1,
  },
  preview: {
    label: '옵션 설정',
    step: 2,
  },
  importing: {
    label: '업로드',
    step: 3,
  },
  complete: {
    label: '완료',
    step: 4,
  },
}

type Props = {
  currentStep: number
}

export function ProgressIndicator({ currentStep }: Readonly<Props>) {
  return (
    <div className="flex items-center justify-between relative px-4">
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-zinc-800/60 -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-8 h-0.5 bg-gradient-to-r from-blue-600 to-blue-500 -translate-y-1/2 transition ease-out"
        style={{ width: `calc(${((currentStep - 1) / 3) * 100}% * (100% - 4rem) / 100%)` }}
      />
      {Object.values(STEP_MAP).map(({ label, step }) => {
        const isActive = step <= currentStep
        const isCurrent = step === currentStep

        return (
          <div className="relative z-10 flex flex-col items-center" key={label}>
            <div
              aria-current={isCurrent}
              aria-selected={isActive}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold bg-zinc-900 border-zinc-700 text-zinc-500
              transition aria-selected:bg-linear-to-br aria-selected:from-blue-600 aria-selected:to-blue-500 aria-selected:border-transparent aria-selected:text-foreground aria-current:scale-110 aria-current:shadow-lg aria-current:shadow-blue-500/20"
            >
              {step}
            </div>
            {isCurrent && (
              <span className="text-xs mt-3 absolute top-full whitespace-nowrap font-medium text-zinc-300">
                {label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
