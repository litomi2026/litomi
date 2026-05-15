export type AdSlotDefinition = Readonly<{
  id: string
  zoneId: number
  width: number
  height: number
}>

export type JuicyAdsLayoutNode =
  | {
      type: 'group'
      className?: string
      children: readonly JuicyAdsLayoutNode[]
    }
  | {
      type: 'slot'
      slot: AdSlotDefinition
      className?: string
    }
