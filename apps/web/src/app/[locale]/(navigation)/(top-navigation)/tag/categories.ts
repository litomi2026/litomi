export const TAG_CATEGORY_PARAMS = ['female', 'male', 'mixed', 'other'] as const

export type CategoryParam = (typeof TAG_CATEGORY_PARAMS)[number]
