import { SHORT_NAME } from '@/constants'
import Image from 'next/image'

export default async function Page() {
  return (
    <main className="flex justify-center items-center h-dvh p-4">
      <div className="grid gap-3 text-center max-w-prose">
        <div className="flex justify-center items-center gap-2">
          <Image alt="로고" height={24} src="/logo.svg" width={24} />
          <h1 className="font-bold text-2xl">{SHORT_NAME}</h1>
        </div>
        <h2 className="font-medium text-xl">본 웹사이트는 만 19세 이상의 사용자만을 대상으로 합니다.</h2>
        <p className="font-medium">
          만 19세 미만의 사용자는 본 웹사이트를 이용할 수 없습니다. 모든 사용자는 본 웹사이트를 이용하실 때에는 이용자
          본인의 나이를 확인하고 이용하시기 바랍니다. 만 19세 미만의 사용자가 본 웹사이트를 이용함으로써 발생하는 모든
          책임은 사용자 본인에게 있습니다.
        </p>
      </div>
    </main>
  )
}
