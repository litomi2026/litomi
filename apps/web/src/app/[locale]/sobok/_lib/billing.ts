import { UserVisibleError } from '@/utils/api-request'

export interface BillingKeyErrorMessages {
  cancelled: string
  failed: string
}

// PortOne 빌링키 발급 — PC는 팝업/iframe으로 즉시 resolve되고, 모바일은 redirectUrl로
// 페이지가 떠났다가 쿼리 파라미터를 들고 돌아온다(복귀 처리는 각 화면의 effect가
// consumeBillingKeyRedirect로 수행).
export async function requestBillingKeyIssuance(input: {
  storeId: string
  channelKey: string
  issueName: string
  errorMessages: BillingKeyErrorMessages
}): Promise<string> {
  const { requestIssueBillingKey } = await import('@portone/browser-sdk/v2')

  const issued = await requestIssueBillingKey({
    storeId: input.storeId,
    channelKey: input.channelKey,
    billingKeyMethod: 'CARD',
    issueName: input.issueName,
    redirectUrl: `${window.location.origin}${window.location.pathname}`,
  })

  if (!issued) {
    throw new UserVisibleError(input.errorMessages.cancelled)
  }

  if (issued.code) {
    throw new UserVisibleError(issued.message ?? input.errorMessages.failed)
  }

  return issued.billingKey
}

export type BillingKeyRedirectResult = { billingKey: string } | { errorMessage: string }

// 리다이렉트 복귀 파라미터를 소비(URL 정리 포함)한다. null = 복귀 상황이 아님.
export function consumeBillingKeyRedirect(fallbackErrorMessage: string): BillingKeyRedirectResult | null {
  const params = new URLSearchParams(window.location.search)
  const billingKey = params.get('billingKey')
  const code = params.get('code')

  if (!billingKey && !code) {
    return null
  }

  window.history.replaceState(null, '', window.location.pathname)

  if (billingKey && params.get('transactionType') === 'ISSUE_BILLING_KEY') {
    return { billingKey }
  }

  return { errorMessage: params.get('message') ?? fallbackErrorMessage }
}
