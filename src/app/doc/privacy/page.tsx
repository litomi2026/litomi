import { Metadata } from 'next'
import Link from 'next/link'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'

const EFFECTIVE_DATE = '2026-01-04'
const CONTACT_EMAIL = 'litomi2026@gmail.com'

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
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <header className="space-y-2">
          <Link
            className="inline-flex text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            href="/new/1"
            prefetch={false}
          >
            ← 돌아가기
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">개인정보 처리방침</h1>
            <p className="mt-1 text-sm text-zinc-400">어떤 정보를 어떤 목적으로 처리하는지 안내합니다.</p>
          </div>
        </header>

        <nav aria-label="목차" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-sm font-semibold text-zinc-200">목차</p>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#collect">
                1. 수집·처리하는 정보
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#purpose">
                2. 이용 목적
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#retention">
                3. 보유 및 파기
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#thirdparty">
                4. 외부 서비스 이용(제3자 제공/위탁)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#cookies">
                5. 쿠키 및 유사 기술
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#rights">
                6. 이용자의 권리
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#contact">
                7. 문의
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#changes">
                8. 변경
              </a>
            </li>
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          <section className="space-y-3" id="collect">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">1. 수집·처리하는 정보</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              서비스 제공을 위해 아래 정보를 수집·생성·처리할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                <span className="font-medium text-zinc-200">계정 정보</span>: 내부 사용자 ID, 로그인 ID, 닉네임, 프로필
                이미지 URL, 성인 여부 등
              </li>
              <li>
                <span className="font-medium text-zinc-200">서비스 이용 정보</span>: 북마크/내 서재/감상 기록/평가 등
                이용자가 서비스에서 생성·저장한 데이터
              </li>
              <li>
                <span className="font-medium text-zinc-200">로그/기기 정보</span>: 접속 기록, IP 주소(또는 그 일부),
                브라우저 정보, 기기/OS 정보, 페이지 뷰 등
              </li>
              <li>
                <span className="font-medium text-zinc-200">성능/통계 정보</span>: Google Analytics 및 Web Vitals을 통해
                수집되는 이용/성능 지표, Amplitude 이벤트
              </li>
              <li>
                <span className="font-medium text-zinc-200">광고 관련 정보</span>: 광고 식별자, 광고 클릭 시각, 포인트
                적립·사용 내역, 남용 방지를 위한 검증/제한 상태
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-zinc-300">
              다음 항목은 일반적인 서비스 이용 과정에서는 수집하지 않습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>실명, 이메일 주소, 연락처, 거주지, 국적 등 개인을 식별할 수 있는 정보</li>
            </ul>
            <p className="text-xs text-zinc-500">
              단,{' '}
              <Link
                className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                href="/doc/dmca"
                prefetch={false}
              >
                저작권/DMCA 신고 및 이의제기
              </Link>
              를 제출하는 경우에는 처리에 필요한 범위에서 제출하신 정보(이름, 이메일, 연락처, 주소 등)가 수집·보관될 수
              있습니다.
            </p>
          </section>

          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">2. 이용 목적</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>계정 관리 및 서비스 제공(로그인 유지, 북마크/내역 동기화 등)</li>
              <li>서비스 품질 개선 및 통계 분석(이용 패턴/성능 지표 분석)</li>
              <li>자동화 트래픽 보안 및 포인트 부정 이용 방지</li>
              <li>광고 제공 및 포인트 적립/정산 처리</li>
              <li>법령 준수 및 분쟁 대응</li>
            </ul>
          </section>

          <section className="space-y-3" id="retention">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">3. 보유 및 파기</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              개인정보는 목적 달성에 필요한 기간 동안 보관하고, 목적 달성 후에는 관련 법령 및 내부 정책에 따라 지체 없이
              파기합니다. 다만, 분쟁 대응, 부정 이용 방지, 법적 의무 준수를 위해 필요한 범위에서 일정 기간 보관될 수
              있습니다.
            </p>
          </section>

          <section className="space-y-3" id="thirdparty">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              4. 외부 서비스 이용(제3자 제공/위탁)
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 서비스는 안정적인 제공을 위해 아래와 같은 외부 서비스를 이용할 수 있습니다. 외부 서비스는 각 사업자의
              정책에 따라 데이터를 처리할 수 있습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                <span className="font-medium text-zinc-200">보안/인프라</span>: Cloudflare, Vercel, Supabase, Google
                Cloud Platform
              </li>
              <li>
                <span className="font-medium text-zinc-200">분석</span>: Google Analytics, Amplitude
              </li>
              <li>
                <span className="font-medium text-zinc-200">광고</span>: Adsterra 등 제3자 광고 네트워크
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-zinc-300">
              아래의 경우에도 대한민국 법관으로부터 적법한 절차에 따라 압수·수색 영장이 발부되기 전까진 어느 주체에게도
              제공하지 않습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>법령에 의거하거나 수사 목적으로 관계 기관의 요청이 있는 경우</li>
              <li>수사 기관에서 임의제출 요청이 있는 경우</li>
              <li>이용자 간의 고소·고발로 인한 경우</li>
            </ul>
          </section>

          <section className="space-y-3" id="cookies">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">5. 쿠키 및 유사 기술</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 서비스는 로그인 유지, 보안, 통계를 위해 쿠키 및 유사 기술을 사용할 수 있습니다. 쿠키 저장을 원하지 않는
              경우 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인, 포인트 적립 등 일부 기능이 제한될 수
              있습니다.
            </p>
          </section>

          <section className="space-y-3" id="rights">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">6. 이용자의 권리</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              이용자는 관련 법령에 따라 개인정보 열람, 정정·삭제, 처리 정지 등을 요청할 수 있습니다. 아래 문의처로
              연락하시기 바랍니다.
            </p>
          </section>

          <section className="space-y-3" id="contact">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">7. 문의</h2>
            <p className="text-sm text-zinc-300">
              개인정보 관련 문의:{' '}
              <a
                className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section className="space-y-3" id="changes">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">8. 변경</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 개인정보 처리방침은 관련 법령, 정책 및 내부 운영 방침에 따라 변경될 수 있습니다.
            </p>
          </section>
        </article>

        <footer className="mt-10 border-t border-zinc-800 pt-6">
          <p className="text-center text-sm text-zinc-300">시행일 {EFFECTIVE_DATE}</p>
        </footer>
      </div>
    </div>
  )
}
