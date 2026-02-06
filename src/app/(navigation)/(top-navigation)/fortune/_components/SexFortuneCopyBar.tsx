import { Flame } from 'lucide-react'

import { COPY_BAR_CLASS, COPY_BUTTON_CLASS } from './sexFortuneStyles'

export function SexFortuneCopyBar({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <div className={COPY_BAR_CLASS}>
      <button className={COPY_BUTTON_CLASS} onClick={onCopy} type="button">
        <Flame className="size-4" />
        {copied ? '복사됐어요' : '결과 복사'}
      </button>
    </div>
  )
}
