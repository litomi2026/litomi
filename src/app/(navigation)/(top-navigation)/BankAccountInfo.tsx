'use client'

import useClipboard from '@/hook/useClipboard'

export default function BankAccountInfo() {
  const { copy } = useClipboard()
  const bankAccount = 'ㅋㅋㅇ뱅크 3333-23-9770326 곽*욱'

  return (
    <button className="hover:underline" onClick={() => copy(bankAccount)}>
      {bankAccount}
    </button>
  )
}
