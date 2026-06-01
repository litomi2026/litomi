'use client'

import type {
  PATCHV1NotificationCriteriaIdBody,
  PATCHV1NotificationCriteriaIdResponse,
  POSTV1NotificationCriteriaBody,
  POSTV1NotificationCriteriaResponse,
} from '@litomi/contracts'

import { NotificationConditionType } from '@litomi/domain/notification/model'
import { MAX_NOTIFICATION_CRITERIA_CONDITIONS } from '@litomi/domain/notification/policy'
import { getInvalidParams } from '@litomi/http/problem-details'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { ProblemDetailsError } from '@/utils/api-request'

import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { useRouter } from '@/i18n/navigation'

import type { NotificationCriteria } from './types'

import { createNotificationCriteria, updateNotificationCriteria } from './api'
import ConditionInput, { type ConditionInputRow } from './ConditionInput'

interface Props {
  editingCriteria: NotificationCriteria | null
  isOpen: boolean
  onClose: () => void
}

type SaveNotificationCriteriaResponse = PATCHV1NotificationCriteriaIdResponse | POSTV1NotificationCriteriaResponse

type SaveNotificationCriteriaVariables =
  | {
      body: PATCHV1NotificationCriteriaIdBody
      criteriaId: number
      mode: 'update'
    }
  | {
      body: POSTV1NotificationCriteriaBody
      mode: 'create'
    }

const LOCAL_MUTATION_ERROR_STATUSES: readonly number[] = [400, 403, 404, 409]

export default function NotificationCriteriaModal({ isOpen, onClose, editingCriteria }: Props) {
  const [conditionRows, setConditionRows] = useState<ConditionInputRow[]>(() =>
    getInitialConditionRows(editingCriteria),
  )

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const nameId = useId()
  const { guardAdultAccess } = useAdultAccessGuard()

  const formKey = `${isOpen ? 'open' : 'closed'}:${editingCriteria?.id ?? 'new'}:${editingCriteria?.updatedAt.getTime() ?? 0}`
  const labelClassName = 'block text-sm font-medium text-zinc-300 mb-1'
  const nameError = fieldErrors.name

  const saveMutation = useMutation<
    SaveNotificationCriteriaResponse,
    ProblemDetailsError,
    SaveNotificationCriteriaVariables
  >({
    mutationFn: (variables) => {
      if (variables.mode === 'update') {
        return updateNotificationCriteria(variables.criteriaId, variables.body)
      }

      return createNotificationCriteria(variables.body)
    },

    onSuccess: (_data, variables) => {
      toast.success(variables.mode === 'update' ? '알림 기준을 수정했어요' : '알림 기준을 생성했어요')
      router.refresh()
      onClose()
    },

    onError: (error) => {
      setFieldErrors(Object.fromEntries(getInvalidParams(error.problem).map((param) => [param.name, param.reason])))

      if (LOCAL_MUTATION_ERROR_STATUSES.includes(error.status)) {
        toast.warning(error.problem.detail || '입력을 확인해 주세요')
      }
    },

    meta: {
      suppressGlobalErrorToastForStatuses: LOCAL_MUTATION_ERROR_STATUSES,
    },
  })

  const isPending = saveMutation.isPending

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending || !guardAdultAccess()) {
      return
    }

    const formData = new FormData(event.currentTarget)
    const conditionTypes = formData.getAll('condition-type')
    const conditionValues = formData.getAll('condition-value')
    const excludedConditionIds = new Set(formData.getAll('condition-excluded'))

    const payloadConditions = conditionRows.flatMap((row, index) => {
      const type = conditionTypes[index]
      const value = conditionValues[index]

      if (typeof type !== 'string' || typeof value !== 'string') {
        return []
      }

      const trimmedValue = value.trim()

      if (!trimmedValue) {
        return []
      }

      return [
        {
          type: Number.parseInt(type, 10),
          value: trimmedValue,
          isExcluded: excludedConditionIds.has(row.id),
        },
      ]
    })

    const baseBody = {
      name: String(formData.get('name') ?? ''),
      conditions: payloadConditions,
    }

    setFieldErrors({})

    if (editingCriteria) {
      saveMutation.mutate({ mode: 'update', criteriaId: editingCriteria.id, body: baseBody })
      return
    }

    saveMutation.mutate({ mode: 'create', body: { ...baseBody, isActive: true } })
  }

  function handleAddCondition() {
    setConditionRows((prev) => {
      if (prev.length >= MAX_NOTIFICATION_CRITERIA_CONDITIONS) {
        return prev
      }

      return [...prev, createConditionInputRow(crypto.randomUUID())]
    })
  }

  function handleRemoveCondition(index: number) {
    setConditionRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)))
  }

  useEffect(() => {
    if (isOpen) {
      setConditionRows(getInitialConditionRows(editingCriteria))
      setFieldErrors({})
    }
  }, [editingCriteria, isOpen])

  return (
    <Dialog
      ariaLabel={editingCriteria ? '알림 조건 수정' : '새 알림 만들기'}
      className="sm:max-w-lg"
      onClose={onClose}
      open={isOpen}
    >
      <form className="flex flex-1 flex-col min-h-0" key={formKey} onSubmit={handleSubmit}>
        <DialogHeader onClose={onClose} title={editingCriteria ? '알림 조건 수정' : '새 알림 만들기'} />

        <DialogBody className="flex flex-col gap-4">
          <p className="text-sm text-zinc-500 -mt-2">관심있는 작품을 놓치지 않도록 알림 조건을 설정하세요</p>
          <div>
            <label className={labelClassName} htmlFor={nameId}>
              알림 이름
            </label>
            <input
              aria-invalid={Boolean(nameError)}
              autoCapitalize="off"
              className={twMerge(
                'w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 placeholder-zinc-500',
                'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent',
                'aria-invalid:ring-2 aria-invalid:ring-red-500 disabled:opacity-50 transition',
              )}
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
              {conditionRows.map((row, index) => (
                <ConditionInput
                  isPending={isPending}
                  key={row.id}
                  onRemove={() => handleRemoveCondition(index)}
                  row={row}
                  showRemoveButton={conditionRows.length > 1}
                />
              ))}
            </div>
            <button
              className={twMerge(
                'inline-flex items-center gap-2 px-3 py-2 text-sm text-brand hover:bg-zinc-800/50',
                'rounded-lg disabled:opacity-50 transition',
              )}
              disabled={isPending || conditionRows.length >= MAX_NOTIFICATION_CRITERIA_CONDITIONS}
              onClick={handleAddCondition}
              type="button"
            >
              <Plus className="size-4 shrink-0" />
              조건 추가
            </button>

            {conditionRows.length >= MAX_NOTIFICATION_CRITERIA_CONDITIONS && (
              <p className="flex items-center gap-2 text-xs text-yellow-500">
                <span className="inline-block w-4 h-4 rounded bg-yellow-500/10 text-yellow-500 text-center leading-4 text-[10px] font-medium">
                  !
                </span>
                최대 {MAX_NOTIFICATION_CRITERIA_CONDITIONS}개 조건까지 추가 가능해요
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="flex gap-2">
          <button
            className={twMerge(
              'flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg',
              'transition focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50',
            )}
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            취소
          </button>
          <button
            className={twMerge(
              'flex items-center justify-center flex-1 px-4 py-2.5 bg-brand hover:bg-brand/90',
              'text-background font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-brand/50',
              'disabled:opacity-50',
            )}
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

function createConditionInputRow(
  id: string,
  initialCondition?: ConditionInputRow['initialCondition'],
): ConditionInputRow {
  return {
    id,
    initialCondition: initialCondition ?? {
      type: NotificationConditionType.SERIES,
      value: '',
      isExcluded: false,
    },
  }
}

function getInitialConditionRows(editingCriteria: NotificationCriteria | null): ConditionInputRow[] {
  if (!editingCriteria) {
    return [createConditionInputRow('new-0')]
  }

  return editingCriteria.conditions.map((condition, index) =>
    createConditionInputRow(`criteria-${editingCriteria.id}-${index}`, {
      type: condition.type as NonNullable<ConditionInputRow['initialCondition']>['type'],
      value: condition.value,
      isExcluded: condition.isExcluded === true,
    }),
  )
}
