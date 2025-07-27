import IconInfo from '@/components/icons/IconInfo'
import IconX from '@/components/icons/IconX'

import { DEFAULT_CENSORED_TAGS } from './constants'

export default function DefaultCensorshipInfo() {
  return (
    <div className="mx-4">
      <details className="group bg-zinc-800/50 rounded-lg border-2 border-zinc-700 overflow-hidden">
        <summary className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/70 transition cursor-pointer list-none">
          <div className="flex items-center gap-2 text-sm">
            <IconInfo className="w-4 text-zinc-400" />
            <span className="text-zinc-300">기본 검열 규칙이 적용되어 있어요</span>
          </div>
          <IconX className="w-4 text-zinc-400 transition rotate-45 group-open:rotate-0" />
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
          <p className="text-xs border-t border-zinc-700 pt-3">
            💡 <span className="text-zinc-300">팁:</span> 위 태그들을 완전히 숨기려면 사용자 규칙으로 동일한 태그를{' '}
            <span className="text-red-500">숨기기</span> 검열로 추가해주세요
          </p>
        </div>
      </details>
    </div>
  )
}
