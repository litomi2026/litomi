import { useState } from 'react'

type Props = {
  className?: string
}

export default function ToggleButton({ className = '' }: Props) {
  const [enabled, setEnabled] = useState(false)

  return (
    <button
      aria-pressed={enabled}
      className={`relative aspect-[7/4]  bg-gray-300 flex items-center rounded-full transition duration-300 focus:outline-none ${className}`}
      onClick={() => setEnabled(!enabled)}
      type="button"
    >
      <span className="sr-only">Toggle setting</span>
      <div className="p-[5%] h-full aspect-square">
        <div
          aria-checked={enabled}
          className="aria-checked:translate-x-7 h-full transform rounded-full bg-white transition duration-300"
        />
      </div>
    </button>
  )
}
