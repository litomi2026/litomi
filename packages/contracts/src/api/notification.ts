import { NotificationFilter } from '@litomi/domain/notification/filter'
import { NotificationConditionType } from '@litomi/domain/notification/model'
import {
  MAX_CRITERIA_NAME_LENGTH,
  MAX_NOTIFICATION_COUNT,
  MAX_NOTIFICATION_CRITERIA_CONDITIONS,
} from '@litomi/domain/notification/policy'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'
import { z } from 'zod'

export interface NotificationItem {
  id: number
  userId: number
  createdAt: Date
  type: number
  read: boolean
  title: string
  body: string
  data: string | null
  sentAt: Date | null
}

export interface GETV1NotificationResponse {
  notifications: NotificationItem[]
  hasNextPage: boolean
}

export type GETV1NotificationUnreadCountResponse = number

export const deleteV1NotificationBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_NOTIFICATION_COUNT),
})

export type DELETEV1NotificationBody = z.infer<typeof deleteV1NotificationBodySchema>

export interface DELETEV1NotificationResponse {
  ids: number[]
}

export const patchV1NotificationReadBodySchema = deleteV1NotificationBodySchema

export type PATCHV1NotificationReadBody = z.infer<typeof patchV1NotificationReadBodySchema>

export type PATCHV1NotificationReadResponse = DELETEV1NotificationResponse

export interface PATCHV1NotificationReadAllResponse {
  updatedCount: number
}

const notificationCriteriaConditionSchema = z.object({
  type: z.enum(NotificationConditionType, { error: '올바른 조건 타입을 선택해 주세요' }),
  value: z
    .string()
    .min(1, '조건 값을 입력해 주세요')
    .max(100, '조건 값은 100자 이하여야 해요')
    .transform((value) => normalizeValue(value)),
  isExcluded: z.boolean().optional().default(false),
})

const notificationCriteriaConditionsSchema = z
  .array(notificationCriteriaConditionSchema)
  .min(1, '최소 1개 조건이 필요해요')
  .max(MAX_NOTIFICATION_CRITERIA_CONDITIONS, `최대 ${MAX_NOTIFICATION_CRITERIA_CONDITIONS}개 조건까지 추가할 수 있어요`)
  .superRefine((conditions, ctx) => {
    const seen = new Set<string>()

    for (const [index, condition] of conditions.entries()) {
      const key = `${condition.type}:${condition.value}`

      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: '같은 조건은 한 번만 추가할 수 있어요',
          path: [index, 'value'],
        })
        continue
      }

      seen.add(key)
    }
  })

export const postV1NotificationCriteriaBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '알림 이름을 입력해 주세요')
    .max(MAX_CRITERIA_NAME_LENGTH, `알림 이름은 ${MAX_CRITERIA_NAME_LENGTH}자 이하여야 해요`),
  conditions: notificationCriteriaConditionsSchema,
  isActive: z.boolean().optional().default(true),
})

export type POSTV1NotificationCriteriaBody = z.input<typeof postV1NotificationCriteriaBodySchema>

export interface POSTV1NotificationCriteriaResponse {
  createdAt: number
  id: number
  isActive: boolean
  name: string
}

export const patchV1NotificationCriteriaIdBodySchema = z
  .object({
    name: postV1NotificationCriteriaBodySchema.shape.name.optional(),
    conditions: notificationCriteriaConditionsSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: '변경할 알림 기준 정보를 입력해 주세요',
  })

export type PATCHV1NotificationCriteriaIdBody = z.input<typeof patchV1NotificationCriteriaIdBodySchema>

export interface PATCHV1NotificationCriteriaIdResponse {
  id: number
  isActive: boolean
  name: string
}

export interface DELETEV1NotificationCriteriaIdResponse {
  id: number
}

const notificationFilterSchema = z.enum(NotificationFilter)

export const getV1NotificationQuerySchema = z.object({
  nextId: z.coerce.number().optional(),
  filter: z.union([notificationFilterSchema, z.array(notificationFilterSchema)]).optional(),
})
