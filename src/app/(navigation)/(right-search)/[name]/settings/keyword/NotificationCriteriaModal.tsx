'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import IconPlus from '@/components/icons/IconPlus'
import IconSpinner from '@/components/icons/IconSpinner'
import IconTrash from '@/components/icons/IconTrash'
import IconX from '@/components/icons/IconX'
import CustomSelect from '@/components/ui/CustomSelect'
import Modal from '@/components/ui/Modal'
import { NotificationConditionType, NotificationConditionTypeNames } from '@/database/enum'
import useActionResponse, { getFieldError } from '@/hook/useActionResponse'

import type { NotificationCriteria } from './types'

import { createNotificationCriteria, updateNotificationCriteria } from './actions'

interface Props {
  editingCriteria: NotificationCriteria | null
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCriteriaModal({ isOpen, onClose, editingCriteria }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [conditionCount, setConditionCount] = useState(editingCriteria?.conditions.length || 1)
  const nameId = useId()

  const processAndSubmit = async (formData: FormData) => {
    const conditionCountFromForm = parseInt(formData.get('conditionCount')?.toString() || '1')

    // Collect conditions from form elements
    const conditions = []
    for (let i = 0; i < conditionCountFromForm; i++) {
      const type = formData.get(`condition-type-${i}`)
      const value = formData.get(`condition-value-${i}`)

      if (type && value && value.toString().trim()) {
        conditions.push({
          type: parseInt(type.toString()),
          value: value.toString().trim(),
        })
      }
    }

    // Create new FormData with processed conditions
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

  const [response, dispatchAction, isPending] = useActionResponse({
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
    <Modal
      className="w-full h-full sm:w-[32rem] sm:h-auto sm:max-w-[calc(100vw-2rem)] sm:max-h-[calc(100vh-8rem)]"
      onClose={onClose}
      open={isOpen}
    >
      <form
        action={dispatchAction}
        className="flex flex-col h-full sm:max-h-[calc(100vh-8rem)] bg-zinc-900 overflow-hidden sm:border-2 sm:border-zinc-700 sm:rounded-xl"
        key={editingCriteria?.id || 'new'}
        ref={formRef}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-bold text-zinc-100 sm:text-lg">
            {editingCriteria ? '알림 조건 수정' : '새 알림 만들기'}
          </h3>
          <button
            className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 transition sm:p-1 sm:mr-0"
            onClick={onClose}
            type="button"
          >
            <IconX className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:mb-1">
          <input name="conditionCount" type="hidden" value={conditionCount} />
          <p className="text-sm text-zinc-500 -mt-2">관심있는 작품을 놓치지 않도록 알림 조건을 설정하세요</p>
          <div>
            <label htmlFor={nameId}>알림 이름</label>
            <input
              aria-invalid={Boolean(nameError)}
              autoCapitalize="off"
              className="w-full text-base px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 placeholder-zinc-500 
                focus:outline-none focus:ring-2 focus:ring-brand-end/50 focus:border-transparent 
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
            <label>매칭 조건</label>
            <p className="text-xs text-zinc-500">설정한 모든 조건이 일치하는 작품만 알림을 받아요</p>
            <div className="space-y-2">
              {Array.from({ length: conditionCount }, (_, index) => (
                <div className="flex flex-col sm:flex-row gap-2" key={index}>
                  <CustomSelect
                    className="sm:w-40"
                    defaultValue={(
                      editingCriteria?.conditions[index]?.type || NotificationConditionType.SERIES
                    ).toString()}
                    disabled={isPending}
                    name={`condition-type-${index}`}
                    options={Object.entries(NotificationConditionTypeNames).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                  <div className="flex gap-2 flex-1">
                    <input
                      autoCapitalize="off"
                      autoComplete="off"
                      className="flex-1 text-base px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 placeholder-zinc-500 
                        focus:outline-none focus:ring-2 focus:ring-brand-end/50 focus:border-transparent 
                        disabled:opacity-50 transition"
                      defaultValue={editingCriteria?.conditions[index]?.value}
                      disabled={isPending}
                      name={`condition-value-${index}`}
                      placeholder="검색어 입력 (공백은 _로)"
                      required
                      type="text"
                    />
                    {conditionCount > 1 && (
                      <button
                        className="px-2.5 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-900/10 
                          disabled:opacity-50 transition-all"
                        disabled={isPending}
                        onClick={() => handleRemoveCondition(index)}
                        type="button"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-brand-end hover:bg-zinc-800/50 
                rounded-lg disabled:opacity-50 transition"
              disabled={isPending || conditionCount >= 10}
              onClick={handleAddCondition}
              type="button"
            >
              <IconPlus className="h-4 w-4" />
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
        </div>
        <div className="p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex gap-2 pb-safe px-safe">
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
              className="flex items-center justify-center flex-1 px-4 py-2.5 bg-brand-end hover:bg-brand-end/90 
              text-background font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand-end/50
              disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              {isPending ? <IconSpinner className="w-5 h-5" /> : editingCriteria ? '저장' : '만들기'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
