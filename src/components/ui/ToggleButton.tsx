import { ComponentProps } from 'react'

interface Props extends Omit<ComponentProps<'button'>, 'onToggle'> {
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
}

export default function ToggleButton({ className = '', enabled, onToggle, ...props }: Readonly<Props>) {
  return (
    <button
      {...props}
      aria-pressed={enabled}
      className={`relative aspect-[7/4] bg-zinc-400 flex items-center rounded-full focus:outline-none group ${className}`}
      onClick={() => onToggle?.(!enabled)}
      type="button"
    >
      <div className="p-[7%] pr-0 w-1/2">
        <div className="group-[&[aria-pressed='true']]:translate-x-full border border-zinc-300 w-full aspect-square transform rounded-full bg-foreground transition" />
      </div>
    </button>
  )
}
