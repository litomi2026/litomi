import { Metadata } from 'next'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'
import { VERCEL_DEPLOYMENT_ID, VERCEL_GIT_COMMIT_SHA } from '@/constants/env'

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
    <div className="p-4 md:p-16 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:list-inside">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <h1 className="text-3xl font-bold mb-6">이용약관</h1>
        <h2 className="mb-3">제 1 조 (목적)</h2>
        <p className="mb-4">
          이 약관은 Litomi (이하 "본 서비스")의 이용과 관련하여 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을
          규정함을 목적으로 합니다.
        </p>
        <h2 className="mb-3">제 2 조 (용어의 정의)</h2>
        <ul className="mb-4">
          <li>"이용자"라 함은 본 약관에 따라 본 서비스를 이용하는 개인 또는 단체를 말합니다.</li>
          <li>"서비스"라 함은 Litomi 사이트에서 제공하는 온라인 상의 모든 서비스 및 부가 기능을 말합니다.</li>
        </ul>
        <h2 className="mb-2">제 3 조 (서비스 목적)</h2>
        <p className="mb-4">
          본 서비스는 불법 도박, 피싱, 스캠, 성인 광고 등이 있는 사이트의 많은 만화 작품을 수집하여 제공하는 것을
          목적으로 하며, 여타 만화 사이트가 이용자에게 해를 끼치는 광고로 수익을 창출하는 것을 방지하기 위해 오픈 소스로
          운영됩니다.
        </p>
        <h2 className="mb-2">제 4 조 (광고 게재 정책)</h2>
        <p className="mb-4">
          본 서비스는 현재 및 향후에도 도박, 성인물, 약물, 스캠, 피싱 등 사용자에게 금전적, 정신적 피해를 끼치는 광고를
          게재하지 않을 것입니다. 본 서비스는 불법 광고를 통한 수익 창출을 목적으로 하지 않습니다.
        </p>
        <h2 className="mb-2">제 5 조 (오픈 소스 전환)</h2>
        <p className="mb-4">
          Litomi 소스 코드는 평생 오픈 소스로 공개할 예정입니다. 이 경우, 이용자께서는 개별적으로 Vercel 클라우드 등
          선호하는 플랫폼을 활용하여 자체적으로 호스팅할 수 있습니다.
        </p>
        <h2 className="mb-2">제 6 조 (지원하는 브라우저)</h2>
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
        <h3 className="mt-6 text-center">시행일 2025-10-20</h3>
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
