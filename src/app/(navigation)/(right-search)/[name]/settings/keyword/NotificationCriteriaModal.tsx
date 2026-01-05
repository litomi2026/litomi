'use client'

import { Loader2, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import useServerAction, { getFieldError } from '@/hook/useServerAction'

import type { NotificationCriteria } from './types'

import { createNotificationCriteria, updateNotificationCriteria } from './actions'
import ConditionInput from './ConditionInput'

interface Props {
  editingCriteria: NotificationCriteria | null
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCriteriaModal({ isOpen, onClose, editingCriteria }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [conditionCount, setConditionCount] = useState(editingCriteria?.conditions.length || 1)
  const nameId = useId()
  const labelClassName = 'block text-sm font-medium text-zinc-300 mb-1'

  const processAndSubmit = async (formData: FormData) => {
    const conditionCountFromForm = parseInt(formData.get('conditionCount')?.toString() || '1')
    const conditions = []

    for (let i = 0; i < conditionCountFromForm; i++) {
      const type = formData.get(`condition-type-${i}`)
      const value = formData.get(`condition-value-${i}`)
      const isExcluded = formData.get(`condition-excluded-${i}`) === 'on'

      if (type && value && value.toString().trim()) {
        conditions.push({
          type: parseInt(type.toString()),
          value: value.toString().trim(),
          isExcluded,
        })
      }
    }

    const processedData = new FormData()
    processedData.append('name', formData.get('name') ?? '')
    processedData.append('conditions', JSON.stringify(conditions))
    processedData.append('isActive', 'true')

    if (editingCriteria) {
      processedData.append('id', editingCriteria.id.toString())
      return updateNotificationCriteria(processedData)
    } else {
      return createNotificationCriteria(processedData)
    }
  }

  const [response, dispatchAction, isPending] = useServerAction({
    action: processAndSubmit,
    onSuccess: (data) => {
      toast.success(data)
      onClose()
    },
  })

  const nameError = getFieldError(response, 'name')

  const handleAddCondition = () => {
    setConditionCount((prev) => Math.min(prev + 1, 10))
  }

  const handleRemoveCondition = (index: number) => {
    // Get the current values before removing
    const form = formRef.current
    if (!form) return

    const conditions: Array<{ type: string; value: string }> = []

    // Collect all current values except the one being removed
    for (let i = 0; i < conditionCount; i++) {
      if (i === index) continue

      const typeSelect = form.elements.namedItem(`condition-type-${i}`) as HTMLSelectElement
      const valueInput = form.elements.namedItem(`condition-value-${i}`) as HTMLInputElement

      if (typeSelect && valueInput) {
        conditions.push({
          type: typeSelect.value,
          value: valueInput.value,
        })
      }
    }

    // Update condition count
    setConditionCount((prev) => Math.max(prev - 1, 1))

    // Restore values after DOM updates
    setTimeout(() => {
      conditions.forEach((condition, newIndex) => {
        const typeSelect = form.elements.namedItem(`condition-type-${newIndex}`) as HTMLSelectElement
        const valueInput = form.elements.namedItem(`condition-value-${newIndex}`) as HTMLInputElement

        if (typeSelect) typeSelect.value = condition.type
        if (valueInput) valueInput.value = condition.value
      })
    }, 0)
  }

  // NOTE: 모달이 열릴 때 조건 개수 설정
  useEffect(() => {
    if (isOpen) {
      setConditionCount(editingCriteria?.conditions.length || 1)
    }
  }, [editingCriteria, isOpen])

  return (
    <Dialog
      ariaLabel={editingCriteria ? '알림 조건 수정' : '새 알림 만들기'}
      className="sm:max-w-lg"
      onClose={onClose}
      open={isOpen}
    >
      <form
        action={dispatchAction}
        className="flex flex-1 flex-col min-h-0"
        key={editingCriteria?.id || 'new'}
        ref={formRef}
      >
        <DialogHeader onClose={onClose} title={editingCriteria ? '알림 조건 수정' : '새 알림 만들기'} />

        <DialogBody className="flex flex-col gap-4">
          <input name="conditionCount" type="hidden" value={conditionCount} />
          <p className="text-sm text-zinc-500 -mt-2">관심있는 작품을 놓치지 않도록 알림 조건을 설정하세요</p>
          <div>
            <label className={labelClassName} htmlFor={nameId}>
              알림 이름
            </label>
            <input
              aria-invalid={Boolean(nameError)}
              autoCapitalize="off"
              className="w-full text-base px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 placeholder-zinc-500 
                focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent 
                aria-invalid:ring-2 aria-invalid:ring-red-500 disabled:opacity-50 transition"
              defaultValue={editingCriteria?.name}
              disabled={isPending}
              id={nameId}
              name="name"
              placeholder="나루토 신작 알림"
              required
              type="text"
            />
            {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
          </div>
          <div className="flex-1 space-y-3">
            <label className={labelClassName}>매칭 조건</label>
            <p className="text-xs text-zinc-500">
              포함 조건은 모두 만족해야 하고, 제외 조건이 하나라도 있으면 알림을 받지 않아요
            </p>
            <div className="space-y-2">
              {Array.from({ length: conditionCount }, (_, index) => (
                <ConditionInput
                  index={index}
                  initialCondition={editingCriteria?.conditions[index]}
                  isPending={isPending}
                  key={index}
                  onRemove={() => handleRemoveCondition(index)}
                  showRemoveButton={conditionCount > 1}
                />
              ))}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-zinc-800/50 
                rounded-lg disabled:opacity-50 transition"
              disabled={isPending || conditionCount >= 10}
              onClick={handleAddCondition}
              type="button"
            >
              <Plus className="size-4 shrink-0" />
              조건 추가
            </button>

            {conditionCount >= 10 && (
              <p className="flex items-center gap-2 text-xs text-yellow-500">
                <span className="inline-block w-4 h-4 rounded bg-yellow-500/10 text-yellow-500 text-center leading-4 text-[10px] font-medium">
                  !
                </span>
                최대 10개 조건까지 추가 가능해요
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <button
            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg
                transition focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className="flex items-center justify-center flex-1 px-4 py-2.5 bg-brand hover:bg-brand/90 
                text-background font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand/50
                disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : editingCriteria ? '저장' : '만들기'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
