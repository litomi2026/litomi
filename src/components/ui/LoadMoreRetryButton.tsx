'use client'

type Props = {
  onRetry: () => Promise<unknown> | void
  label?: string
  containerClassName?: string
  buttonClassName?: string
}

export default function LoadMoreRetryButton({
  onRetry,
  label = '불러오기에 실패했어요 · 다시 시도하기',
  containerClassName = 'w-full p-2 flex justify-center',
  buttonClassName = 'text-xs text-zinc-400 hover:text-foreground px-3 py-2 rounded-md hover:bg-zinc-800 transition',
}: Props) {
  return (
    <div className={containerClassName}>
      <button className={buttonClassName} onClick={() => onRetry()} type="button">
        {label}
      </button>
    </div>
  )
}
