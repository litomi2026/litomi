import { ComponentProps } from 'react'

interface Props extends Omit<ComponentProps<'input'>, 'onToggle'> {
  onToggle?: (enabled: boolean) => void
}

export default function Toggle({ className = '', title, onToggle, ...props }: Readonly<Props>) {
  return (
    <label className="inline-flex cursor-pointer items-center" title={title}>
      <input {...props} className="sr-only peer" onChange={(e) => onToggle?.(e.target.checked)} type="checkbox" />
      <span
        className={`relative aspect-2/1 bg-zinc-500 rounded-full border box-content transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:inset-y-[10%] after:left-[10%] after:w-[40%] after:bg-foreground after:border after:border-zinc-300 after:rounded-full after:transition after:shadow-sm peer-checked:after:translate-x-full peer-disabled:opacity-50 peer-disabled:cursor-not-allowed ${className}`}
      />
    </label>
  )
}
