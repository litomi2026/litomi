import IconInfo from './icons/IconInfo'
import Tooltip, { TooltipProps } from './ui/Tooltip'

type Props = {
  position: TooltipProps['position']
}

export default function HarpiTooltip({ position }: Props) {
  return (
    <Tooltip position={position}>
      <div className="flex items-center gap-1">
        <p className="text-xs md:text-sm">이미지가 안 보여요!</p>
        <IconInfo className="w-3 md:w-4" />
      </div>
      <div className="rounded-xl border-2 border-zinc-700 bg-background whitespace-pre-line p-3 text-sm max-w-xs">
        <p>
          hp 모드에선 브러우저 요청에 <code>referer</code> 헤더를 추가해야 이미지를 볼 수 있어요.
        </p>
        <hr className="text-zinc-500 my-3" />
        <p>
          (Desktop Chrome)
          <br />
          <a className="text-blue-500" href="https://modheader.com/" rel="noopener noreferrer" target="_blank">
            ModHeader
          </a>{' '}
          확장 프로그램을 사용해서 <code>referer: https://pk3.harpi.in</code> 헤더를 추가해주세요.
        </p>
        <hr className="text-zinc-500 my-3" />
        <p>
          (Mobile) <code>referer: https://pk3.harpi.in</code> 헤더를 추가할 수 있는 브라우저를 사용해주세요. 저도 방법을
          찾고 싶어요..
        </p>
      </div>
    </Tooltip>
  )
}
