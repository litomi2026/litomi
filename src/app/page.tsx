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
        이 정보 내용은 청소년유해매체물로서 "정보통신망 이용촉진 및 정보보호 등에 관한 법률" 및 "청소년 보호법"에 따라
        19세 미만의 청소년이 이용할 수 없습니다.
      </h1>
      <h2 className="max-w-prose">
        본 웹사이트에는 19세 이상 전용의 성인 콘텐츠(성인 만화 등)가 포함되어 있습니다. 이용자는 "19세 이상 성인입니다"
        버튼을 클릭함으로써, 본인이 19세 이상이거나 현지법상 성인임을 확인하고 해당 콘텐츠 이용에 동의하는 것으로
        간주됩니다.
      </h2>
      <div className="grid gap-2 [&_a]:border-2 [&_a]:rounded-lg [&_a]:w-60 [&_a]:py-2 [&_a]:font-semibold ">
        <Link
          className="bg-brand-gradient relative text-background before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40"
          href="/mangas/1/hi/card"
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
          <svg className="w-6" viewBox="0 0 24 24">
            <path
              d="M12 1a11 11 0 0 0-3.5 21.4c.6.1.8-.2.8-.5v-2c-2.8.5-3.5-.7-3.7-1.3-.2-.3-.7-1.3-1.2-1.6-.3-.2-.9-.7 0-.7s1.5.8 1.7 1.1c1 1.7 2.6 1.2 3.2 1 .1-.8.4-1.3.7-1.5-2.4-.3-5-1.3-5-5.5 0-1.2.4-2.2 1.1-3a4 4 0 0 1 .2-2.8s.9-.3 3 1a10.2 10.2 0 0 1 5.5 0c2-1.4 3-1 3-1a4 4 0 0 1 .1 2.9 4 4 0 0 1 1.1 3c0 4.1-2.5 5-5 5.4.4.3.8 1 .8 2v3c0 .3.2.6.7.5A11 11 0 0 0 12 1Z"
              fill="currentColor"
            />
          </svg>
          GitHub
        </a>
        <a
          className="flex justify-center items-center gap-2 rounded"
          href="https://discord.gg/xTrbQaxpyD"
          target="_blank"
        >
          <svg className="w-6" viewBox="0 -28.5 256 256">
            <path
              d="M216.9 16.6A208.5 208.5 0 0 0 164 0c-2.2 4.1-4.9 9.6-6.7 14a194 194 0 0 0-58.6 0C97 9.6 94.2 4.1 92 0a207.8 207.8 0 0 0-53 16.6A221.5 221.5 0 0 0 1 165a211.2 211.2 0 0 0 65 33 161 161 0 0 0 13.8-22.8c-7.6-2.9-15-6.5-21.8-10.6l5.3-4.3a149.3 149.3 0 0 0 129.6 0c1.7 1.5 3.5 3 5.3 4.3a136 136 0 0 1-21.9 10.6c4 8 8.7 15.7 13.9 22.9a210.7 210.7 0 0 0 64.8-33.2c5.3-56.3-9-105.1-38-148.4ZM85.5 135.1c-12.7 0-23-11.8-23-26.2 0-14.4 10.1-26.2 23-26.2 12.8 0 23.2 11.8 23 26.2 0 14.4-10.2 26.2-23 26.2Zm85 0c-12.6 0-23-11.8-23-26.2 0-14.4 10.2-26.2 23-26.2 12.9 0 23.3 11.8 23 26.2 0 14.4-10.1 26.2-23 26.2Z"
              fill="#5865F2"
            />
          </svg>
          Discord
        </a>
      </div>
    </main>
  )
}
