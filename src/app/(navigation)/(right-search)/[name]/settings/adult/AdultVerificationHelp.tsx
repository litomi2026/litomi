import { ChevronDown } from 'lucide-react'

export default function AdultVerificationHelp() {
  return (
    <div className="grid gap-2">
      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-zinc-200">왜 성인 인증이 필요한가요?</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2 text-sm text-zinc-400">
          <p>
            대한민국에서는 청소년에게 유해하다고 판단되는 콘텐츠(청소년유해매체물 등)에 대해 청소년 보호를 위한 조치가 요구될
            수 있어요. 이에 불필요하게 많은 개인정보를 받기보다는, <span className="text-zinc-200">성인인지 아닌지</span>
            를 확인하는 방식으로 접근을 제한하려고 해요.
          </p>
          <p className="text-xs text-zinc-500">북마크/평점/서재 등 사용자 상호작용 기능은 성인 인증이 필요해요.</p>
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-zinc-200">인증은 어떻게 진행돼요?</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3">
          <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
            <li>버튼을 누르면 비바톤 인증 페이지가 새 창(팝업)으로 열려요.</li>
            <li>비바톤에서 성인 여부 확인을 완료하면 결과가 리토미로 전달돼요.</li>
            <li>성공하면 현재 화면의 상태가 자동으로 갱신돼요.</li>
          </ol>
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-zinc-200">어떤 정보가 저장되나요?</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2">
          <p className="text-sm text-zinc-400">
            비바톤 인증을 완료하면 인증 상태를 유지하기 위해 <span className="text-zinc-200">아래 정보</span>를 저장해요.
            저장된 정보는 프로필이나 공개 화면에 표시되지 않아요.
          </p>
          <ul className="text-sm text-zinc-400 list-disc list-inside space-y-1">
            <li>비바톤 사용자 ID(연동 식별용)</li>
            <li>성인 여부(Y/N), 마지막 인증 시각</li>
          </ul>
          <p className="text-xs text-zinc-500">
            비바톤 로그인 정보(아이디/비밀번호)는 저장되지 않아요. 비바톤 연동 해제는 비밀번호(및 2단계 인증)로 보호되며,
            연동 해제 시 저장된 인증 정보가 영구적으로 삭제돼요.
          </p>
          <div className="text-xs text-zinc-500">
            <a
              className="underline underline-offset-2 hover:text-zinc-300"
              href="https://bauth.bbaton.com"
              rel="noreferrer"
              target="_blank"
            >
              비바톤 익명 인증 기록 조회
            </a>
          </div>
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-zinc-200">자주 묻는 질문</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2 text-sm text-zinc-400">
          <div className="space-y-1">
            <div className="font-medium text-zinc-300">팝업이 열리지 않아요</div>
            <p className="text-zinc-400">브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요.</p>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-zinc-300">인증이 갑자기 취소됐어요</div>
            <p className="text-zinc-400">인증 창을 닫았거나, 인증이 완료되기 전에 창이 종료되면 취소로 처리돼요.</p>
          </div>
          <div className="space-y-1">
            <div className="font-medium text-zinc-300">이미 다른 계정에 연결돼 있다고 나와요</div>
            <p className="text-zinc-400">
              하나의 비바톤 계정은 하나의 리토미 계정에만 연결할 수 있어요. 기존 계정에서 연동을 해제한 뒤 다시 시도해 주세요.
            </p>
          </div>
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
            <div className="text-sm font-medium text-zinc-200">관련 법령 · 출처</div>
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </div>
        </summary>
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2">
          <p className="text-sm text-zinc-400">
            이 정보는 2025-12-15 기준으로 작성된 요약이에요. 법적 효력을 갖는 유권해석이 아니며, 구체적인 적용은 상황에
            따라 달라질 수 있어요.
          </p>
          <div className="text-xs text-zinc-500">
            <a
              className="underline underline-offset-2 hover:text-zinc-300"
              href="https://easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=718&ccfNo=2&cciNo=2&cnpClsNo=3"
              rel="noreferrer"
              target="_blank"
            >
              찾기 쉬운 생활법령정보 (청소년유해매체물)
            </a>
          </div>
        </div>
      </details>
    </div>
  )
}


