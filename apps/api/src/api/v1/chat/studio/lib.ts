// 마지막 4자리만 남기고 가린다 — 계좌번호 원문은 응답에 싣지 않는다.
export function maskAccountNumber(accountNumber: string): string {
  const digits = accountNumber.replaceAll('-', '')
  const last4 = digits.slice(-4)
  return `${'•'.repeat(Math.max(0, digits.length - 4))}${last4}`
}
