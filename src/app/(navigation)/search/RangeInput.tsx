type BaseProps = {
  label: string
  minId: string
  maxId: string
  minValue: string
  maxValue: string
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
  minPlaceholder?: string
  maxPlaceholder?: string
  className?: string
}

type DateRangeProps = BaseProps & {
  type: 'date'
}

type NumberRangeProps = BaseProps & {
  type: 'number'
  min?: number
  max?: number
}

type RangeInputProps = DateRangeProps | NumberRangeProps

export default function RangeInput({
  label,
  type,
  minId,
  maxId,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = '최소',
  maxPlaceholder = '최대',
  className,
  ...props
}: RangeInputProps) {
  const inputClassName = `flex-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100
    placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent
    invalid:ring-2 invalid:ring-red-500
    ${type === 'number' ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' : ''}
    ${type === 'date' ? 'min-w-40' : 'min-w-0'}`

  const getMinMaxProps = () => {
    if (type === 'number' && 'min' in props && 'max' in props) {
      return {
        minInput: {
          min: props.min,
          max: props.max,
        },
        maxInput: {
          min: minValue ? Math.max(Number(minValue), props.min!) : props.min,
          max: props.max,
        },
      }
    } else if (type === 'date') {
      const today = new Date().toISOString().split('T')[0]
      return {
        minInput: {
          max: maxValue || today,
        },
        maxInput: {
          min: minValue,
          max: today,
        },
      }
    }
    return { minInput: {}, maxInput: {} }
  }

  const { minInput, maxInput } = getMinMaxProps()

  return (
    <fieldset className={className}>
      <legend className="block text-sm font-medium text-zinc-300 mb-1">{label}</legend>
      <div className={`flex gap-2 items-center ${type === 'date' ? 'flex-wrap' : ''}`}>
        <input
          className={inputClassName}
          id={minId}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={minPlaceholder}
          type={type}
          value={minValue}
          {...(type === 'number' && { pattern: '[0-9]*' })}
          {...minInput}
        />
        <span className={`text-zinc-500 flex-shrink-0`}>~</span>
        <input
          className={inputClassName}
          id={maxId}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={maxPlaceholder}
          type={type}
          value={maxValue}
          {...(type === 'number' && { pattern: '[0-9]*' })}
          {...maxInput}
        />
      </div>
    </fieldset>
  )
}
