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
    <div className="p-4 md:p-8">
      <div className="max-w-prose mx-auto pb-safe px-safe">
        <Header1 />

        <nav aria-label="목차" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-sm font-semibold text-zinc-200">목차</p>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#purpose">
                제 1 조 (목적)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#definitions">
                제 2 조 (용어의 정의)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#service">
                제 3 조 (서비스 제공 및 변경)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#ads">
                제 4 조 (광고 및 외부 링크)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#libo">
                제 5 조 (포인트)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#browsers">
                제 6 조 (지원하는 브라우저)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#dmca">
                제 7 조 (저작권 침해 신고 및 처리)
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#liability">
                제 8 조 (면책 및 책임의 제한)
              </a>
            </li>
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">제 1 조 (목적)</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              이 약관은 본 서비스 이용과 관련해 이용자의 권리·의무 및 책임 사항, 기타 필요한 사항을 정리하는 것을
              목적으로 합니다.
            </p>
          </section>

          <section className="space-y-3" id="definitions">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">제 2 조 (용어의 정의)</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                <span className="font-medium text-zinc-200">&quot;이용자&quot;</span>는 본 약관에 따라 본 서비스를
                이용하는 개인 또는 단체를 말합니다.
              </li>
              <li>
                <span className="font-medium text-zinc-200">&quot;서비스&quot;</span>는 litomi.in 도메인에서 제공되는
                온라인 서비스 및 부가 기능을 말합니다.
              </li>
              <li>
                <span className="font-medium text-zinc-200">&quot;광고&quot;</span>는 본 서비스에 노출되는 광고 및 광고
                관련 UI(스크립트, 배너, 네이티브 광고 등)를 말합니다.
              </li>
              <li>
                <span className="font-medium text-zinc-200">&quot;리보&quot;</span>는 본 서비스 내에서 적립·사용할 수
                있는 포인트를 말합니다. 리보는 현금으로 환전되거나 제3자에게 양도될 수 없으며, 적립·사용 기준 및 한도는
                서비스 내 안내에 따르고 운영상 변경될 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3" id="service">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              제 3 조 (서비스 제공 및 변경)
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                본 서비스는 이용자가 다양한 만화 작품을 보다 안전하고 편리하게 열람할 수 있도록 돕는 것을 목표로 합니다.
              </li>
              <li>
                운영 및 기술 환경에 따라 서비스의 전부 또는 일부 기능이 추가·변경·중단될 수 있습니다. 특히 광고 운영
                방식, 리보 적립·사용 정책은 부정 이용 방지 및 운영 사정에 따라 변경될 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3" id="ads">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              제 4 조 (광고 및 외부 링크)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                본 서비스는 운영을 위해 광고를 게재할 수 있습니다. 광고는 제3자(광고 네트워크/광고주)가 제공할 수 있으며
                <code className="inline-flex items-center whitespace-nowrap rounded-md bg-white/6 px-1.5 py-0.5 font-mono text-xs text-zinc-200 ring-1 ring-white/10">
                  /libo
                </code>{' '}
                페이지에서만 노출합니다.
              </li>
              <li>
                본 서비스는 광고 제공을 위해 Adsterra 등 제3자 광고 네트워크의 스크립트/태그를 사용할 수 있습니다. 제3자
                광고 네트워크는 자체 정책에 따라 쿠키 또는 유사 기술을 사용할 수 있습니다.
              </li>
              <li>
                광고를 클릭하면 외부 사이트가 새 창/새 탭에서 열릴 수 있습니다. 외부 사이트의
                콘텐츠·상품·서비스·개인정보 처리·거래 등에 대한 책임은 해당 사이트에 있습니다.
              </li>
              <li>
                본 서비스는 불법 도박, 피싱, 스캠, 악성코드 유도 등 이용자에게 피해를 줄 수 있는 광고의 노출을 줄이기
                위해 노력하나, 제3자 제공 특성상 모든 광고를 사전에 통제하거나 보증할 수는 없습니다.
              </li>
              <li>
                대한민국에서 접속한 이용자는 관련 법령 준수를 위해 일부 기능 이용에 성인 인증이 필요할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3" id="libo">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">제 5 조 (포인트)</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                리보는 본 서비스 내 기능(예: 내 공간 확장 등)을 위해 제공되는 포인트입니다. 리보는 현금으로 환전되거나
                외부 결제에 사용될 수 없으며, 제3자에게 양도·대여·담보 제공될 수 없습니다.
              </p>
              <ul className="list-disc list-inside space-y-2 marker:text-zinc-600">
                <li>
                  <span className="font-medium text-zinc-200">적립</span>: 리보는 이용자가 자발적으로 보상형 광고를
                  이용하는 경우 적립될 수 있습니다. 남용 방지를 위해 로그인, Cloudflare 보안 검증, 적립 횟수 제한, 대기
                  시간, 토큰 유효기간 등 정책이 적용될 수 있습니다.
                </li>
                <li>
                  <span className="font-medium text-zinc-200">차단/환경 영향</span>: 광고 차단 프로그램, 트래킹 차단
                  설정, 브라우저/네트워크 환경에 따라 광고가 정상 노출되지 않거나 리보 적립이 제한될 수 있습니다.
                </li>
                <li>
                  <span className="font-medium text-zinc-200">부정 이용</span>: 자동화된 클릭, 봇/스크립트 사용, 다중
                  계정, 취약점 악용 등 부정 이용이 의심되는 경우, 적립된 리보를 취소하거나 이용 제한(기능 제한/계정 제한
                  등)이 적용될 수 있습니다.
                </li>
                <li>
                  <span className="font-medium text-zinc-200">정정</span>: 시스템 오류, 중복 적립, 비정상 트래픽 등으로
                  리보가 잘못 적립·차감된 경우, 본 서비스는 기록을 기준으로 합리적인 범위에서 이를 정정할 수 있습니다.
                </li>
              </ul>
              <p className="text-xs text-zinc-500">
                리보의 적립·사용 기준 및 한도는 서비스 내 안내에 따르며, 운영상 변경될 수 있습니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="browsers">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              제 6 조 (지원하는 브라우저)
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 서비스는 최신 버전의 웹 브라우저에서 최적화되어 있으며, 구형 브라우저에서는 일부 기능이 제한될 수
              있습니다. 공식적으로 다음 버전 이상에서 지원합니다.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-zinc-300 marker:text-zinc-600">
              <li>Chrome 109</li>
              <li>Edge 135</li>
              <li>Firefox 137</li>
              <li>Safari 16.1</li>
              <li>Samsung Internet 25</li>
              <li>iOS Safari 16</li>
            </ul>
          </section>

          <section className="space-y-3" id="dmca">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              제 7 조 (저작권 침해 신고 및 처리)
            </h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 서비스는 저작권 침해 신고를 접수하고 처리하기 위한 절차를 운영합니다. 권리자 또는 적법한 대리인은{' '}
              <Link
                className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                href="/doc/dmca"
                prefetch={false}
              >
                저작권/DMCA 신고 페이지
              </Link>
              를 통해 통지를 제출할 수 있으며, 유효한 통지가 접수되면 해당 콘텐츠에 대한 접근이 제한될 수 있습니다.
              라이선스 또는 권한이 있다고 주장하는 경우에도 동일 페이지에서 이의제기(카운터 노티스)를 제출할 수
              있습니다.
            </p>
          </section>

          <section className="space-y-3" id="liability">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              제 8 조 (면책 및 책임의 제한)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                본 서비스는 법령상 허용되는 범위 내에서, 제3자가 제공하는 광고·외부 링크·외부 사이트 이용으로 인해
                발생하는 손해에 대해 책임을 제한할 수 있습니다. 단, 본 서비스의 고의 또는 중대한 과실로 인한 경우에는
                그러하지 아니합니다.
              </li>
              <li>
                제3자 광고 네트워크의 정책 변경, 네트워크 장애, 이용자 환경(브라우저 설정/차단 프로그램 등)으로 인해
                광고가 노출되지 않거나 리보가 적립되지 않는 경우가 있을 수 있습니다.
              </li>
            </ul>
          </section>
        </article>

        <footer className="mt-10 border-t border-zinc-800 pt-6">
          <h3 className="text-center text-sm text-zinc-300">시행일 2026-01-04</h3>
          <div className="mt-3 flex flex-col items-center gap-2 text-xs text-center text-zinc-500">
            {VERCEL_DEPLOYMENT_ID && (
              <>
                <h4 className="text-zinc-400">배포 ID</h4>
                <p className="wrap-break-word">{VERCEL_DEPLOYMENT_ID}</p>
              </>
            )}
            {VERCEL_GIT_COMMIT_SHA && (
              <>
                <h4 className="text-zinc-400">커밋 해시</h4>
                <p className="wrap-break-word">{VERCEL_GIT_COMMIT_SHA.slice(0, 10)}</p>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
