import { Metadata } from 'next'
import Link from 'next/link'

import { APP_ORIGIN, defaultOpenGraph, SHORT_NAME } from '@/constants'

const EFFECTIVE_DATE = '2026-04-04'
const CONTACT_DEPARTMENT = '리토미 운영팀'
const CONTACT_ROLE = '운영자'
const CONTACT_EMAIL = 'litomi2026@gmail.com'

export const metadata: Metadata = {
  title: '청소년보호정책',
  openGraph: {
    ...defaultOpenGraph,
    title: `청소년보호정책 - ${SHORT_NAME}`,
    url: `${APP_ORIGIN}/doc/youth-protection`,
  },
  alternates: {
    canonical: '/doc/youth-protection',
    languages: { ko: '/doc/youth-protection' },
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
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">청소년보호정책</h1>
            <p className="mt-1 text-sm text-zinc-400">
              리토미는 청소년이 유해한 정보로부터 보호받을 수 있도록 관련 법령과 서비스 운영 기준에 따라 정책을 수립하고
              적용합니다.
            </p>
          </div>
        </header>

        <nav aria-label="목차" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-sm font-semibold text-zinc-200">목차</p>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#purpose">
                1. 목적 및 적용 범위
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#controls">
                2. 청소년 접근 제한 및 관리 조치
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#monitoring">
                3. 유해정보 모니터링 및 대응
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#process">
                4. 운영 절차 및 내부 관리
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#complaint">
                5. 피해상담 및 고충처리
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#officer">
                6. 청소년보호 책임자 및 담당자
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#changes">
                7. 변경
              </a>
            </li>
          </ol>
        </nav>

        <article className="mt-8 space-y-10">
          <section className="space-y-3" id="purpose">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">1. 목적 및 적용 범위</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                본 정책은 리토미가 정보통신망을 통해 제공하는 정보와 이용자 상호작용 기능에 대하여,{' '}
                <span className="font-medium text-zinc-200">청소년 보호법</span>,{' '}
                <span className="font-medium text-zinc-200">정보통신망 이용촉진 및 정보보호 등에 관한 법률</span> 및
                관련 법령의 취지에 따라 청소년 보호를 위한 기준과 절차를 안내하기 위해 마련되었습니다.
              </p>
              <p>
                리토미는 만화 감상과 탐색을 위한 서비스를 제공하며, 청소년에게 부적절할 수 있는 정보의 노출을 줄이기
                위해 접근 제한, 신고 처리, 운영 정책 반영 등의 조치를 적용할 수 있습니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="controls">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              2. 청소년 접근 제한 및 관리 조치
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                서비스 진입 화면에서 본 웹사이트가 <span className="font-medium text-zinc-200">19세 이상 성인</span>을
                대상으로 한다는 고지와 이용 제한 안내를 제공합니다.
              </li>
              <li>
                로그인 사용자의 경우, 필요한 기능에 한하여{' '}
                <span className="font-medium text-zinc-200">BBaton 기반 익명 성인인증</span> 절차를 요구할 수 있습니다.
              </li>
              <li>
                대한민국 법령, 내부 정책 또는 서비스 운영 판단에 따라 일부 기능이나 특정 이용 흐름에는 추가적인{' '}
                <span className="font-medium text-zinc-200">성인인증 또는 접근 제한</span>이 적용될 수 있습니다.
              </li>
              <li>
                청소년에게 유해할 우려가 있는 정보는 공개 범위 조정, 노출 제한, 삭제, 계정 제한 등 합리적인 보호조치를
                적용할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3" id="monitoring">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              3. 유해정보 모니터링 및 대응
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                리토미는 이용자 신고, 권리자 통지, 운영 검토, 법령상 요청 등을 바탕으로 청소년 유해정보 또는 위법 정보
                여부를 확인할 수 있습니다.
              </p>
              <p>
                검토 결과 청소년 보호 또는 법령 준수를 위해 필요하다고 판단되는 경우, 해당 정보에 대해 노출 제한, 삭제,
                임시조치, 접근 차단, 계정 제재, 추가 자료 요청 등의 조치를 할 수 있습니다.
              </p>
              <p>
                특히 아동·청소년 대상 성착취물, 불법촬영물, 강요된 성적 이미지, 명백한 위법정보 등 중대한 사안은 서비스
                내 일반 신고 절차보다 우선하여 신속히 제한 또는 삭제 조치를 검토합니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="process">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              4. 운영 절차 및 내부 관리
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                운영팀은 청소년 보호 관련 법령, 신고 유형, 접근 제한 기준을 검토하고 서비스 운영 기준에 반영합니다.
              </li>
              <li>청소년 보호와 관련된 문의 또는 신고가 접수되면 사안의 성격에 따라 우선순위를 나누어 확인합니다.</li>
              <li>
                필요한 경우 관련 화면, 게시물, 작품 정보, 신고 내용, 처리 기록 등을 확인하여 후속 조치를 결정합니다.
              </li>
              <li>정책, 법령, 서비스 구조가 바뀌면 청소년 보호 절차와 안내 문구를 함께 업데이트합니다.</li>
            </ul>
          </section>

          <section className="space-y-3" id="complaint">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">5. 피해상담 및 고충처리</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                청소년 유해정보 노출, 접근 제한 미비, 불법·유해 콘텐츠 유통 등과 관련한 문의나 신고는 아래 이메일로
                접수할 수 있습니다. 저작권 침해 신고는{' '}
                <Link
                  className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                  href="/doc/dmca"
                  prefetch={false}
                >
                  저작권/DMCA 신고 페이지
                </Link>
                를 이용해 주세요. 그 밖의 일반 문의는 아래 청소년보호 책임자 및 담당자 연락처로 보내주시면 확인 후
                처리합니다.
              </p>
              <p>
                문의처:{' '}
                <a
                  className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </section>

          <section className="space-y-3" id="officer">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              6. 청소년보호 책임자 및 담당자
            </h2>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/30">
              <table className="w-full text-left text-sm text-zinc-300">
                <tbody>
                  <tr className="border-b border-zinc-800">
                    <th className="w-32 bg-zinc-950/40 px-4 py-3 font-medium text-zinc-200">부서</th>
                    <td className="px-4 py-3">{CONTACT_DEPARTMENT}</td>
                  </tr>
                  <tr className="border-b border-zinc-800">
                    <th className="bg-zinc-950/40 px-4 py-3 font-medium text-zinc-200">직위</th>
                    <td className="px-4 py-3">{CONTACT_ROLE}</td>
                  </tr>
                  <tr>
                    <th className="bg-zinc-950/40 px-4 py-3 font-medium text-zinc-200">이메일</th>
                    <td className="px-4 py-3">
                      <a
                        className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                        href={`mailto:${CONTACT_EMAIL}`}
                      >
                        {CONTACT_EMAIL}
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3" id="changes">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">7. 변경</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 정책은 관련 법령, 서비스 구조, 신고 처리 절차 및 내부 운영 기준의 변경에 따라 수정될 수 있습니다.
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
