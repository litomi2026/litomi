import { Metadata } from 'next'
import Link from 'next/link'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  openGraph: {
    ...defaultOpenGraph,
    title: `개인정보 처리방침 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/doc/privacy`,
  },
}

export default async function Page() {
  return (
    <div className="p-4 md:p-16 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:list-inside">
      <div className="max-w-prose mx-auto">
        <h1 className="text-3xl font-bold mb-6">개인정보 처리방침</h1>
        <p className="mb-4">
          귀하의 개인정보는 매우 중요합니다. 본 개인정보 처리방침은 저희가 수집, 처리하는 개인정보의 종류, 처리 방법,
          이용 목적 및 귀하의 권리와 관련된 사항을 명확히 안내하기 위해 마련되었습니다.
        </p>
        <h2 className="mb-3">1. 수집하는 개인정보의 항목</h2>
        <p className="mb-2">서비스 제공 및 개선을 위해 아래와 같은 개인정보를 수집합니다.</p>
        <ul className="mb-4">
          <li>접속 기록 및 쿠키, 기기 정보 등 Google Analytics를 통해 수집되는 정보</li>
          <li>FCP, LCP, CLS, TBT, TTI 등의 Web Vitals 정보</li>
        </ul>
        <p className="mb-2">다음 항목은 일반적인 서비스 이용 과정에서는 수집하지 않습니다.</p>
        <ul className="mb-6">
          <li>이름, 이메일 주소, 연락처, 성별, 나이 등 개인을 조금이라도 식별할 수 있는 정보</li>
        </ul>
        <p className="mb-6 text-sm text-zinc-400">
          단,{' '}
          <Link className="underline underline-offset-2" href="/doc/dmca" prefetch={false}>
            저작권/DMCA 신고 및 이의제기
          </Link>
          를 제출하는 경우에는 처리에 필요한 범위에서 제출하신 정보(이름, 이메일, 연락처, 주소 등)가 수집·보관될 수
          있습니다.
        </p>
        <h2 className="mb-3">2. 개인정보 수집 및 이용 목적</h2>
        <p className="mb-2">수집한 개인정보는 다음의 목적을 위해 사용됩니다.</p>
        <ul className="mb-6">
          <li>서비스 제공, 운영, 개선</li>
          <li>개인 포트폴리오 성과에 대한 근거 자료</li>
        </ul>
        <h2 className="mb-3">3. 개인정보 보유 및 이용 기간</h2>
        <p className="mb-6">개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
        <h2 className="mb-3">4. 개인정보의 제3자 제공</h2>
        <p className="mb-2">
          귀하의 개인정보는 원칙적으로 Google Analytics와 Vercel, Amplitude에 익명 처리되어 제공됩니다. 아래의 경우에도
          대한민국 법관으로부터 적법한 절차에 따라 압수·수색 영장이 발부되기 전까진 어느 주체에게도 제공하지 않습니다.
        </p>
        <ul className="mb-6">
          <li>법령에 의거하거나 수사 목적으로 관계 기관의 요청이 있는 경우</li>
          <li>수사 기관에서 임의제출 요청이 있는 경우</li>
          <li>이용자 간의 고소·고발로 인한 경우</li>
        </ul>
        <h2 className="mb-3">5. 개인정보의 안전성 확보 조치</h2>
        <p className="mb-2">
          귀하의 개인정보를 안전하게 보호하기 위하여 다음과 같은 기술적, 관리적, 물리적 조치를 시행하고 있습니다.
        </p>
        <ul className="mb-6">
          <li>개인정보에 대한 접근 제한 및 관리</li>
          <li>정보의 암호화 및 보안 프로그램 사용</li>
          <li>정기적인 보안 점검 실시</li>
        </ul>
        <h2 className="mb-3">6. 쿠키의 사용 및 관리</h2>
        <p className="mb-2">
          이용자에게 보다 나은 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다. 쿠키는 이용자의 컴퓨터 환경을 식별하기
          위한 작은 텍스트 파일입니다. 쿠키 사용을 원하지 않으실 경우, 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수
          있으나, 이 경우 서비스 이용에 일부 제한이 있을 수 있습니다.
        </p>
        <p className="mb-6">
          본 서비스의 주 목적은 많은 이용자와 활성 사용자를 확보하여 서비스 개발 및 운영 경험이 있다고 포트폴리오에
          작성하는 것입니다. 앞으로도 사이트에 광고를 게시하지 않을테니, 서비스 개선 및 정확한 이용자 통계 수집을 위해
          되도록이면 쿠키 사용을 허용해 주시고 광고 차단 프로그램(AdBlock 등)을 해제해주신다면 감사하겠습니다. 광고 차단
          프로그램이 통계 수집을 막기 때문입니다.
        </p>
        <h2 className="mb-3">7. 개인정보 처리방침 변경</h2>
        <p className="mb-6">본 개인정보 처리방침은 관련 법령, 정책 및 내부 운영 방침에 따라 변경될 수 있습니다.</p>
        <h3 className="mb-1 text-center">시행일 2025-09-28</h3>
      </div>
    </div>
  )
}
