import { SHORT_NAME } from '@/constants'
import logoImage from '@/images/logo.webp'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page() {
  return (
    <main className="flex justify-center items-center h-dvh p-4">
      <div className="grid gap-3 text-center ">
        <Link className="flex items-center gap-2 w-fit mx-auto" href="/">
          <Image alt="로고" priority src={logoImage} width={24} />
          <h1 className="font-bold text-2xl">{SHORT_NAME}</h1>
        </Link>
        <h2 className="font-medium text-xl">본 웹사이트는 19세 이상의 성인 사용자만을 대상으로 합니다.</h2>
        <p className="font-medium max-w-prose">
          19세 미만의 사용자는 본 웹사이트를 이용할 수 없습니다. 모든 사용자는 본 웹사이트를 이용하실 때에는 이용자
          본인의 나이를 확인하고 이용하시기 바랍니다. 만약 이용자가 허위로 연령을 확인하여 발생하는 모든 법적 책임은
          전적으로 이용자 본인에게 있음을 명시합니다. 19세 미만의 사용자가 본 웹사이트를 이용함으로써 발생하는 모든
          책임은 사용자 본인에게 있습니다.
        </p>
      </div>
    </main>
  )
}
