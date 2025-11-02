import IconBookmark from '@/components/icons/IconBookmark'

type Props = {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isVisible: boolean
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function FileSelectStep({ fileInputRef, isVisible, onFileSelect }: Readonly<Props>) {
  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
    >
      <div className="flex flex-col h-full p-6">
        <p className="text-sm text-zinc-400 text-center mb-4 leading-relaxed">
          리토미에서 내보낸 북마크 파일을 선택해주세요
        </p>
        <label className="cursor-pointer flex-1 flex items-center justify-center group">
          <input
            accept=".json,application/json"
            className="hidden"
            onChange={onFileSelect}
            ref={fileInputRef}
            type="file"
          />
          <div className="w-full max-w-sm mx-auto border-2 border-dashed border-zinc-700/60 rounded-2xl p-8 text-center transition group-hover:border-blue-600/40 group-hover:bg-blue-600/5 group-hover:shadow-lg group-hover:shadow-blue-600/10 group-focus-within:border-blue-600/60 group-focus-within:bg-blue-600/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-800/80 flex items-center justify-center transition group-hover:from-blue-600/10 group-hover:to-blue-500/10">
              <IconBookmark className="w-8 h-8 text-zinc-400 transition group-hover:text-blue-400" />
            </div>
            <p className="font-semibold text-zinc-200 mb-2 text-lg">파일을 선택하세요</p>
            <p className="text-sm text-zinc-500">JSON 파일 (최대 1MB)</p>
          </div>
        </label>
      </div>
    </div>
  )
}
