import { ImportState } from './types'

type Props = {
  importState: ImportState
  onClose: () => void
  onImport: () => void
  onReset: () => void
}

const BUTTON_CLASS =
  'flex-1 px-6 py-3 bg-zinc-800/40 border-2 border-zinc-700/40 rounded-xl transition hover:bg-zinc-700/40 hover:border-zinc-600/40 focus:outline-none focus:ring-2 focus:ring-zinc-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900 text-zinc-200'

const PRIMARY_BUTTON_CLASS =
  'flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-foreground rounded-xl transition border-2 border-transparent hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-zinc-900'

export function FooterActions({ importState, onClose, onImport, onReset }: Readonly<Props>) {
  if (importState === 'idle') {
    return (
      <button className={`w-full ${BUTTON_CLASS}`} onClick={onClose} type="button">
        취소
      </button>
    )
  }

  if (importState === 'preview') {
    return (
      <div className="flex gap-3">
        <button className={BUTTON_CLASS} onClick={onReset} type="button">
          뒤로
        </button>
        <button className={PRIMARY_BUTTON_CLASS} onClick={onImport} type="button">
          업로드 시작
        </button>
      </div>
    )
  }

  if (importState === 'importing') {
    return <div className="h-12" />
  }

  return (
    <div className="flex gap-3">
      <button className={BUTTON_CLASS} onClick={onReset} type="button">
        다른 파일 선택
      </button>
      <button className={PRIMARY_BUTTON_CLASS} onClick={onClose} type="button">
        완료
      </button>
    </div>
  )
}
