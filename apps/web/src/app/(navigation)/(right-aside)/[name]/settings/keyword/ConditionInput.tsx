'use client'

import { Trash2 } from 'lucide-react'

import CustomSelect from '@/components/ui/CustomSelect'
import { NotificationConditionType, NotificationConditionTypeNames } from '@/database/enum'

interface Props {
  index: number
  initialCondition?: {
    type: number
    value: string
    isExcluded?: boolean
  }
  isPending: boolean
  onRemove: () => void
  showRemoveButton: boolean
}

export default function ConditionInput({ index, initialCondition, isPending, onRemove, showRemoveButton }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <CustomSelect
        className="sm:w-40"
        defaultValue={(initialCondition?.type || NotificationConditionType.SERIES).toString()}
        disabled={isPending}
        name={`condition-type-${index}`}
        options={Object.entries(NotificationConditionTypeNames).map(([value, label]) => ({
          value,
          label,
        }))}
      />
      <div className="flex gap-2 flex-1 min-w-0">
        <div className="flex flex-1 min-w-0 gap-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand/50 focus-within:border-transparent transition">
          <input
            autoCapitalize="off"
            autoComplete="off"
            className="min-w-0 flex-1 text-base px-3 py-2 bg-transparent placeholder-zinc-500 
              focus:outline-none disabled:opacity-50 transition"
            defaultValue={initialCondition?.value || ''}
            disabled={isPending}
            name={`condition-value-${index}`}
            placeholder="검색어 입력 (공백은 _로)"
            required
            type="text"
          />
          <label
            className="shrink-0 whitespace-nowrap flex items-center px-2.5 sm:px-3 text-xs font-medium transition-colors border-l border-zinc-700 cursor-pointer text-zinc-400 hover:bg-zinc-700/50 has-[input:checked]:bg-red-900/25 has-[input:checked]:text-red-300 has-[input:checked]:border-red-800/40 has-[input:checked]:hover:bg-red-900/35"
            htmlFor={`condition-excluded-${index}`}
            title="클릭하여 포함/제외 전환"
          >
            <input
              className="sr-only peer"
              defaultChecked={initialCondition?.isExcluded}
              disabled={isPending}
              id={`condition-excluded-${index}`}
              name={`condition-excluded-${index}`}
              type="checkbox"
            />
            <span className="peer-checked:hidden">포함</span>
            <span className="peer-checked:inline hidden">제외</span>
          </label>
        </div>
        {showRemoveButton && (
          <button
            className="px-2.5 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/10 disabled:opacity-50 transition"
            disabled={isPending}
            onClick={onRemove}
            type="button"
          >
            <Trash2 className="size-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  )
}
