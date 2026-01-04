import { Metadata } from 'next'
import Link from 'next/link'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'
import { env } from '@/env/server.next'

import Header1 from './Header1'

const { VERCEL_DEPLOYMENT_ID, VERCEL_GIT_COMMIT_SHA } = env

export const metadata: Metadata = {
  title: '이용약관',
  openGraph: {
    ...defaultOpenGraph,
    title: `이용약관 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/doc/terms`,
  },
}

export default async function Page() {
  return (
    <div className="p-4 md:p-16 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <Header1 />
        <h2 className="mb-3">제 1 조 (목적)</h2>
        <p className="mb-4">
          이 약관은 Litomi (이하 "본 서비스")의 이용과 관련하여 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을
          규정함을 목적으로 합니다.
        </p>
        <h2 className="mb-3">제 2 조 (용어의 정의)</h2>
        <ul className="mb-4">
          <li>"이용자"라 함은 본 약관에 따라 본 서비스를 이용하는 개인 또는 단체를 말합니다.</li>
          <li>"서비스"라 함은 Litomi 사이트에서 제공하는 온라인 상의 모든 서비스 및 부가 기능을 말합니다.</li>
          <li>
            "리보"라 함은 본 서비스 내에서 적립·사용할 수 있는 포인트를 말하며, 현금으로 환전되거나 제3자에게 양도될 수
            없습니다. 리보의 적립·사용 기준 및 한도는 서비스 내 안내에 따릅니다.
          </li>
        </ul>
        <h2 className="mb-2">제 3 조 (서비스 목적)</h2>
        <ul className="mb-4">
          <li>
            본 서비스는 이용자가 다양한 만화 작품을 보다 안전하고 편리하게 탐색·열람할 수 있도록 돕는 것을 목적으로
            합니다.
          </li>
          <li>본 서비스는 불법 도박, 피싱, 스캠 등 유해 광고로 인한 피해를 줄이기 위한 운영 원칙을 둡니다.</li>
        </ul>
        <h2 className="mb-2">제 4 조 (광고 게재 정책)</h2>
        <ul className="mb-4">
          <li>본 조에서 말하는 “광고”는 Litomi 도메인에서 노출되는 광고 및 광고 관련 UI를 의미합니다.</li>
          <li>
            본 서비스는 운영을 위해 광고를 게재할 수 있으며, 광고는 제3자(광고 네트워크/광고주)가 제공할 수 있습니다.
          </li>
          <li>
            광고를 클릭하면 외부 사이트가 새 창/새 탭에서 열릴 수 있으며, 해당 외부 사이트의 콘텐츠·상품·서비스·개인정보
            처리·거래에 대한 책임은 해당 사이트에 있습니다.
          </li>
          <li>
            본 서비스는 불법 도박, 피싱, 스캠, 악성코드 유도 등 이용자에게 피해를 줄 수 있는 광고의 노출을 제한하기 위해
            노력합니다. 다만 제3자 제공 특성상 모든 광고를 사전에 통제하거나 보증할 수는 없습니다.
          </li>
          <li>
            리보 적립은 이용자가 자발적으로 광고를 이용하는 경우 제공될 수 있으며, 남용 방지를 위해 인증·횟수 제한·대기
            시간 등 정책이 적용될 수 있습니다. 세부 기준은 서비스 내 안내에 따르며 운영상 변경될 수 있습니다.
          </li>
          <li>
            대한민국에서 접속한 로그인 이용자는 관련 법령 준수를 위해 일부 기능 이용에 성인 인증이 필요할 수 있습니다.
          </li>
        </ul>
        <h2 className="mb-2">제 5 조 (지원하는 브라우저)</h2>
        <p className="mb-4">
          본 서비스는 최신 버전의 웹 브라우저에서 최적화되어 있으며, 구형 브라우저에서는 일부 기능이 제한될 수 있습니다.
          본 서비스는 다음의 브라우저 버전 이상에서 지원됩니다.
        </p>
        <ul className="mb-4">
          <li>Chrome 109</li>
          <li>Edge 135</li>
          <li>Firefox 137</li>
          <li>Safari 16.1</li>
          <li>Samsung Internet 25</li>
          <li>iOS Safari 16</li>
        </ul>
        <h2 className="mb-2">제 6 조 (저작권 침해 신고 및 처리)</h2>
        <p className="mb-4">
          본 서비스는 저작권 침해 신고를 접수하고 처리하기 위한 절차를 운영합니다. 권리자 또는 적법한 대리인은{' '}
          <Link className="underline underline-offset-2" href="/doc/dmca" prefetch={false}>
            저작권/DMCA 신고 페이지
          </Link>
          를 통해 통지를 제출할 수 있으며, 유효한 통지가 접수되면 해당 콘텐츠에 대한 접근이 제한될 수 있습니다. 라이선스
          또는 권한이 있다고 주장하는 경우에도 동일 페이지에서 이의제기(카운터 노티스)를 제출할 수 있습니다.
        </p>
        <h3 className="mt-6 text-center">시행일 2026-01-04</h3>
        <div className="flex flex-col items-center gap-2 text-xs text-center text-zinc-600">
          {VERCEL_DEPLOYMENT_ID && (
            <>
              <h4>배포 ID</h4>
              <p className="wrap-break-word">{VERCEL_DEPLOYMENT_ID}</p>
            </>
          )}
          {VERCEL_GIT_COMMIT_SHA && (
            <>
              <h4>커밋 해시</h4>
              <p className="wrap-break-word">{VERCEL_GIT_COMMIT_SHA.slice(0, 10)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
