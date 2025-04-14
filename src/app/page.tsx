import Link from 'next/link'

export default function Home() {
  return (
    <main className="h-dvh flex flex-col items-center justify-center gap-5 mx-auto p-4 text-center">
      <svg className="w-14 shrink-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="white" r="45" stroke="red" strokeWidth="10" />
        <text
          dominantBaseline="middle"
          fill="black"
          fontFamily="Arial"
          fontSize="40"
          fontWeight="bold"
          textAnchor="middle"
          x="50%"
          y="55"
        >
          19
        </text>
      </svg>
      <h1 className="text-lg font-bold max-w-prose">
        이 정보 내용은 청소년유해매체물로서 “정보통신망 이용촉진 및 정보보호 등에 관한 법률” 및 “청소년 보호법”에 따라
        19세 미만의 청소년이 이용할 수 없습니다.
      </h1>
      <h2 className="max-w-prose">
        본 웹사이트에는 19세 이상 전용의 성인 콘텐츠(성인 만화 등)가 포함되어 있습니다. 이용자는 “19세 이상 성인입니다”
        버튼을 클릭함으로써, 본인이 19세 이상이거나 현지법상 성인임을 확인하고 해당 콘텐츠 이용에 동의하는 것으로
        간주됩니다.
      </h2>
      <div className="grid gap-2 [&_a]:border-2 [&_a]:rounded-lg [&_a]:w-60 [&_a]:py-2 [&_a]:font-semibold ">
        <Link
          className="bg-brand-gradient relative text-background before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40"
          href="/mangas/latest/1/hi"
        >
          19세 이상 성인입니다
        </Link>
        <Link className="rounded" href="/deterrence">
          19세 미만 나가기
        </Link>
        <a
          className="flex justify-center items-center gap-2 rounded"
          href="https://github.com/gwak2837/litomi"
          target="_blank"
        >
          <svg className="align-middle w-6" viewBox="0 0 24 24">
            <path
              d="M12 1C5.9225 1 1 5.9225 1 12C1 16.8675 4.14875 20.9787 8.52125 22.4362C9.07125 22.5325 9.2775 22.2025 9.2775 21.9137C9.2775 21.6525 9.26375 20.7862 9.26375 19.865C6.5 20.3737 5.785 19.1912 5.565 18.5725C5.44125 18.2562 4.905 17.28 4.4375 17.0187C4.0525 16.8125 3.5025 16.3037 4.42375 16.29C5.29 16.2762 5.90875 17.0875 6.115 17.4175C7.105 19.0812 8.68625 18.6137 9.31875 18.325C9.415 17.61 9.70375 17.1287 10.02 16.8537C7.5725 16.5787 5.015 15.63 5.015 11.4225C5.015 10.2262 5.44125 9.23625 6.1425 8.46625C6.0325 8.19125 5.6475 7.06375 6.2525 5.55125C6.2525 5.55125 7.17375 5.2625 9.2775 6.67875C10.1575 6.43125 11.0925 6.3075 12.0275 6.3075C12.9625 6.3075 13.8975 6.43125 14.7775 6.67875C16.8813 5.24875 17.8025 5.55125 17.8025 5.55125C18.4075 7.06375 18.0225 8.19125 17.9125 8.46625C18.6138 9.23625 19.04 10.2125 19.04 11.4225C19.04 15.6437 16.4688 16.5787 14.0213 16.8537C14.42 17.1975 14.7638 17.8575 14.7638 18.8887C14.7638 20.36 14.75 21.5425 14.75 21.9137C14.75 22.2025 14.9563 22.5462 15.5063 22.4362C19.8513 20.9787 23 16.8537 23 12C23 5.9225 18.0775 1 12 1Z"
              fill="currentColor"
            />
          </svg>
          GitHub
        </a>
      </div>
    </main>
  )
}
