type Props = {
  className?: string
  enabled?: boolean
  onToggle?: (enabled: boolean) => void
}

export default function ToggleButton({ className = '', enabled, onToggle }: Props) {
  return (
    <button
      aria-pressed={enabled}
      className={`relative aspect-[7/4] bg-gray-300 flex items-center rounded-full focus:outline-none ${className}`}
      onClick={() => onToggle?.(!enabled)}
      type="button"
    >
      <span className="sr-only">Toggle setting</span>
      <div className="p-[7%] pr-0 w-1/2">
        <div
          aria-checked={enabled}
          className="aria-checked:translate-x-full border border-gray-300 w-full aspect-square transform rounded-full bg-white transition duration-300"
        />
      </div>
    </button>
  )
}
