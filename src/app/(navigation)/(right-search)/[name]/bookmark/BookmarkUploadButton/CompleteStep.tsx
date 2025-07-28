import { ImportResult } from '@/app/api/bookmarks/import/route'

import { ResultCard } from './ResultCard'

type Props = {
  importResult: ImportResult
  isVisible: boolean
}

export function CompleteStep({ importResult, isVisible }: Props) {
  const hasErrors = importResult.errors.length > 0

  return (
    <div
      aria-hidden={!isVisible}
      className="absolute inset-0 transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
    >
      <div className="flex flex-col h-full p-6">
        <div className="text-center mb-4">
          <div
            aria-invalid={hasErrors}
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg transition border-2 bg-gradient-to-br
              aria-invalid:from-amber-600/20 aria-invalid:to-amber-500/10 aria-invalid:text-amber-400 aria-invalid:border-amber-600/30
              from-emerald-600/20 to-emerald-500/10 text-emerald-400 border-emerald-600/30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground">업로드 완료!</h3>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {importResult.imported > 0 && (
            <ResultCard count={importResult.imported} label="성공적으로 가져옴" type="success" />
          )}
          {importResult.skipped > 0 && (
            <ResultCard count={importResult.skipped} label="중복으로 건너뜀" type="warning" />
          )}
          {hasErrors && (
            <details className="group">
              <summary className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600/10 to-red-500/5 rounded-xl border border-red-600/20 cursor-pointer transition hover:bg-red-600/15 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900">
                <span className="font-medium text-zinc-200">오류 발생</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-400 text-lg">{importResult.errors.length}개</span>
                  <svg
                    className="w-5 h-5 text-red-400 group-open:rotate-180 transition"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                </div>
              </summary>
              <div className="mt-3 p-4 bg-zinc-800/30 rounded-xl max-h-32 overflow-y-auto">
                <ul className="space-y-1.5 text-sm">
                  {importResult.errors.map((error, index) => (
                    <li className="flex items-start gap-2 text-red-300" key={index}>
                      <span className="text-red-500/50 mt-1">•</span>
                      <span className="break-all leading-relaxed">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
