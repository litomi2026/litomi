export default function StudioIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background text-center p-6 h-full">
      <div className="w-16 h-16 bg-indigo-500/15 text-indigo-500 rounded-full flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">아티스트 스튜디오</h2>
      <p className="text-zinc-400 max-w-sm mb-6 text-sm">
        정확한 아티스트 핸들(URL)로 접속해 주세요.
        <br />
        예시: <span className="font-mono bg-foreground/10 px-1 py-0.5 rounded">/sobok/studio/litomi</span>
      </p>
    </div>
  )
}
