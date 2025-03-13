import Link from 'next/link'

export default function Home() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center gap-4 mx-auto p-4">
      <div className="flex items-center justify-center gap-4">
        <svg className="w-20 md:w-14 shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" fill="white" r="45" stroke="red" stroke-width="10" />
          <text
            dominant-baseline="middle"
            fill="black"
            font-family="Arial"
            font-size="40"
            font-weight="bold"
            text-anchor="middle"
            x="50%"
            y="55"
          >
            19
          </text>
        </svg>
        <h1 className="text-lg font-bold max-w-prose">
          이 정보 내용은 청소년유해매체물로서 정보통신망 이용촉진 및 정보보호등에 관한 법률 및 청소년 보호법에 따라 19세
          미만의 청소년이 이용할 수 없습니다.
        </h1>
      </div>
      <h2 className="max-w-prose">
        본 웹사이트에는 19세 이상 전용의 성인 콘텐츠(성인 만화 등)가 포함되어 있습니다. 이용자는 “19세 이상 성인입니다”
        버튼을 클릭함으로써, 본인이 19세 이상이거나 현지법상 성인임을 확인하고 해당 콘텐츠 이용에 동의하는 것으로
        간주됩니다.
      </h2>
      <div className="grid gap-2 text-center [&_a]:border [&_a]:rounded [&_a]:px-6 [&_a]:py-2 [&_a]:font-semibold ">
        <Link className="border rounded" href="/deterrence">
          19세 미만 나가기
        </Link>
        <Link className="bg-brand-gradient text-background" href="/manga">
          19세 이상 성인입니다
        </Link>
      </div>
      <div></div>
    </main>
  )
}
