import {
  MAX_CRITERIA_NAME_LENGTH,
  MAX_NOTIFICATION_COUNT,
  MAX_NOTIFICATION_CRITERIA_CONDITIONS,
} from '@litomi/domain/constants/policy'
import { NotificationConditionType } from '@litomi/domain/database/enum'
import { NotificationFilter } from '@litomi/domain/notification/filter'
import { normalizeValue } from '@litomi/domain/utils/normalize-value'
import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  createdAt: z.date(),
  type: z.number(),
  read: z.boolean(),
  title: z.string(),
  body: z.string(),
  data: z.string().nullable(),
  sentAt: z.date().nullable(),
})

export const getNotificationResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  hasNextPage: z.boolean(),
})

export type GETNotificationResponse = z.infer<typeof getNotificationResponseSchema>

export const getUnreadCountResponseSchema = z.number()

export type GETUnreadCountResponse = z.infer<typeof getUnreadCountResponseSchema>

export const deleteV1NotificationBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(MAX_NOTIFICATION_COUNT),
})

export type DELETEV1NotificationBody = z.infer<typeof deleteV1NotificationBodySchema>

export const deleteV1NotificationResponseSchema = z.object({
  ids: z.array(z.number()),
})

export type DELETEV1NotificationResponse = z.infer<typeof deleteV1NotificationResponseSchema>

export const patchV1NotificationReadBodySchema = deleteV1NotificationBodySchema

export type PATCHV1NotificationReadBody = z.infer<typeof patchV1NotificationReadBodySchema>

export const patchV1NotificationReadResponseSchema = deleteV1NotificationResponseSchema

export type PATCHV1NotificationReadResponse = z.infer<typeof patchV1NotificationReadResponseSchema>

export const patchV1NotificationReadAllResponseSchema = z.object({
  updatedCount: z.number(),
})

export type PATCHV1NotificationReadAllResponse = z.infer<typeof patchV1NotificationReadAllResponseSchema>

export const notificationCriteriaConditionSchema = z.object({
  type: z.enum(NotificationConditionType, { error: '올바른 조건 타입을 선택해 주세요' }),
  value: z
    .string()
    .min(1, '조건 값을 입력해 주세요')
    .max(100, '조건 값은 100자 이하여야 해요')
    .transform((value) => normalizeValue(value)),
  isExcluded: z.boolean().optional().default(false),
})

export const notificationCriteriaConditionsSchema = z
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

export const postV1NotificationCriteriaResponseSchema = z.object({
  createdAt: z.number(),
  id: z.number(),
  isActive: z.boolean(),
  name: z.string(),
})

export type POSTV1NotificationCriteriaResponse = z.infer<typeof postV1NotificationCriteriaResponseSchema>

export const notificationFilterSchema = z.enum(NotificationFilter)

export const getNotificationQuerySchema = z.object({
  nextId: z.coerce.number().optional(),
  filter: z.union([notificationFilterSchema, z.array(notificationFilterSchema)]).optional(),
})

export type GETNotificationQuery = z.infer<typeof getNotificationQuerySchema>
