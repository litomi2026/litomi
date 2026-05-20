import type { AnalyticsParams } from './browser'

type PromotionEventParams = {
  campaign_id?: string
  creative_id?: string
  creative_name: string
  creative_slot: string
  destination?: string
  itemIndex?: number
  promotion_id: string
  promotion_name: string
}

export function createPromotionEventParams({ itemIndex, ...params }: PromotionEventParams): AnalyticsParams {
  return {
    ...params,
    items: [
      {
        creative_name: params.creative_name,
        creative_slot: params.creative_slot,
        item_id: params.promotion_id,
        item_name: params.promotion_name,
        promotion_id: params.promotion_id,
        promotion_name: params.promotion_name,
        ...(itemIndex !== undefined && { index: itemIndex }),
      },
    ],
  }
}
