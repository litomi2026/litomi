'use client'

import useClipboard from '@/hook/useClipboard'

export default function BankAccountInfo() {
  const { copy } = useClipboard()
  const bankAccount = '3333-23-9770326'

  return (
    <button className="hover:underline" onClick={() => copy(bankAccount)}>
      ㅋㅋㅇ뱅크 {bankAccount} ㄱㅌㅇ
    </button>
  )
}
