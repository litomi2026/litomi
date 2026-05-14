import { formatLocalDate } from '@/utils/format/date'

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
  const inputClassName = `flex-1 w-full ${type === 'date' ? 'min-w-40' : 'min-w-0'}`

  function getMinMaxProps() {
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
      const today = formatLocalDate(new Date())
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
      <label htmlFor={minId}>{label}</label>
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
        <span className={`text-zinc-500 shrink-0`}>~</span>
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
