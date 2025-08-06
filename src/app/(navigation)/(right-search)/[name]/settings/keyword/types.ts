export type NotificationCriteria = {
  id: number
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  conditions: {
    type: number
    value: string
  }[]
  matchCount: number
  lastMatchedAt: Date | null
}
