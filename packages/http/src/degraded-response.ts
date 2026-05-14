export const DEGRADED_HEADER = 'Litomi-Degraded'
export const DEGRADED_REASON_HEADER = 'Litomi-Degraded-Reason'

export type DegradedReason = 'IMAGES_ONLY'

export function isDegradedResponse(headers: Headers): boolean {
  return headers.get(DEGRADED_HEADER) === '1'
}
