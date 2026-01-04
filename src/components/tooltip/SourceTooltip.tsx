import { Info } from 'lucide-react'

import TooltipPopover from '../ui/TooltipPopover'

type Props = {
  disabled?: boolean
}

export default function SourceTooltip({ disabled }: Readonly<Props>) {
  return (
    <TooltipPopover disabled={disabled} position="bottom" type="tooltip">
      <div aria-disabled={disabled} className="flex items-center gap-1 aria-disabled:text-zinc-600">
        <p className="text-xs md:text-sm">이미지가 안 보여요!</p>
        <Info className="size-3 shrink-0 md:size-4" />
      </div>
      <HiyobiTooltip />
    </TooltipPopover>
  )
}

function HarpiTooltip() {
  return (
    <div className="rounded-xl text-center border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm max-w-xs">
      <p>
        hp 모드에선 브러우저 요청에 <code>referer</code> 헤더를 추가해야 이미지를 볼 수 있어요. 현재 더 편한 방법을 찾고
        있어요.
      </p>
      <hr className="text-zinc-500 my-3" />
      <p>
        (Desktop Chrome)
        <br />
        <a className="text-blue-500" href="https://modheader.com" rel="noopener noreferrer" target="_blank">
          ModHeader
        </a>{' '}
        를 사용해서 <code>referer: https://harpi.in</code> 헤더를 추가해주세요.
      </p>
      <hr className="text-zinc-500 my-3" />
      <p>
        (Mobile) <code>referer: https://harpi.in</code> 헤더를 추가할 수 있는 브라우저를 사용해주세요.
      </p>
    </div>
  )
}

function HiyobiTooltip() {
  return (
    <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm min-w-3xs max-w-xs">
      <p>
        특정 네트워크로 처음으로 접속 시 이미지가 보이지 않는 이슈가 있어요.{' '}
        <a className="text-blue-500" href="https://hiyobi.org" rel="noopener noreferrer" target="_blank">
          hiyobi.org
        </a>{' '}
        사이트에 한 번 방문하고 돌아오면 고쳐지는 거 같아요.
      </p>
    </div>
  )
}
