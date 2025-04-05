export default function Loading() {
  return (
    <main className="flex justify-center items-center h-dvh p-4">
      <div className="w-full bg-zinc-900 h-4 border-2 rounded-full animate-fade-in duration-3000 overflow-hidden">
        <div className="bg-brand-gradient h-full animate-loading-bar"></div>
      </div>
    </main>
  )
}
