import { Info, ShieldOff, X } from 'lucide-react'

import { DEFAULT_CENSORED_TAGS } from './constants'

export default function DefaultCensorshipInfo() {
  return (
    <div className="mx-4">
      <details className="group bg-zinc-800/50 rounded-lg border-2 border-zinc-700 overflow-hidden">
        <summary className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/70 transition cursor-pointer list-none">
          <div className="flex items-start gap-2 text-sm">
            <Info className="w-4 text-zinc-400 mt-0.5 shrink-0" />
            <span className="text-zinc-300">기본 검열 규칙이 적용되어 있어요</span>
          </div>
          <X className="w-4 text-zinc-400 transition rotate-45 group-open:rotate-0" />
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">
          <p className="mb-2">
            사용자 보호를 위해 다음 태그들은 기본적으로 <span className="text-yellow-500 font-medium">흐리게</span>{' '}
            처리돼요:
          </p>
          <ul className="space-y-1 mb-3">
            {DEFAULT_CENSORED_TAGS.map((tag) => (
              <li className="flex items-center gap-2" key={tag}>
                <span className="text-zinc-500">•</span>
                <span>{tag}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs pt-2 flex items-start gap-1.5">
            <ShieldOff className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
            <span>
              <span className="text-zinc-300">기본 검열 해제:</span> 기본 검열을 해제하려면 우선 해당 태그를 추가한 후{' '}
              <span className="text-green-500 font-medium">해제</span>로 변경해주세요
            </span>
          </p>
        </div>
      </details>
    </div>
  )
}
