export const TAG_CATEGORY_PARAMS = ['female', 'male', 'mixed', 'other'] as const

export type CategoryParam = (typeof TAG_CATEGORY_PARAMS)[number]

export function getTagCategoryParam(value: string): CategoryParam | undefined {
  return TAG_CATEGORY_PARAMS.find((category) => category === value)
}
