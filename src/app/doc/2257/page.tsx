import { Metadata } from 'next'
import Link from 'next/link'

import { APP_ORIGIN, defaultOpenGraph, SHORT_NAME } from '@/constants'

const EFFECTIVE_DATE = '2026-04-04'
const CONTACT_EMAIL = 'litomi2026@gmail.com'

export const metadata: Metadata = {
  title: '2257 컴플라이언스 안내',
  openGraph: {
    ...defaultOpenGraph,
    title: `2257 컴플라이언스 안내 - ${SHORT_NAME}`,
    url: `${APP_ORIGIN}/doc/2257`,
  },
  alternates: {
    canonical: '/doc/2257',
    languages: { ko: '/doc/2257' },
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
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              18 U.S.C. §2257 / §2257A 컴플라이언스 안내
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              본 페이지는 서비스의 호스팅 구조와 18 U.S.C. §2257, §2257A 및 28 C.F.R. Part 75 관련 운영 원칙을
              설명합니다.
            </p>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm leading-relaxed text-zinc-300">
          <p>
            본 안내는 서비스 수준의 일반 고지입니다. 개별 업로더 또는 원 저작자가 별도의 작품별 record-keeping
            statement를 제공하는 경우, 해당 작품에 대해서는 그 작품별 고지가 우선합니다.
          </p>
          <p className="mt-3">
            본 서비스는 제3자 업로더가 제공한 개별 고지, 기록 보관 의무의 적용 여부, 또는 특정 작품의 적법성을 보증하지
            않습니다.
          </p>
        </section>

        <nav aria-label="목차" className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
          <p className="text-sm font-semibold text-zinc-200">목차</p>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300">
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#scope">
                1. 적용 범위
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#platform-role">
                2. 플랫폼의 역할
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#non-real-person">
                3. 실제 사람이 아닌 작품
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#real-person">
                4. 실제 사람이 등장하는 예외 콘텐츠
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#uploader-obligations">
                5. 업로더의 책임
              </a>
            </li>
            <li>
              <a className="underline underline-offset-4 hover:text-zinc-100" href="#requests">
                6. 문의 및 조치
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
          <section className="space-y-3" id="scope">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">1. 적용 범위</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                <span className="font-medium text-zinc-200">18 U.S.C. §2257</span>,{' '}
                <span className="font-medium text-zinc-200">18 U.S.C. §2257A</span>, 그리고{' '}
                <span className="font-medium text-zinc-200">28 C.F.R. Part 75</span>는 일반적으로 실제 인간이 등장하는
                특정 시각적 표현물에 대한 연령 확인, 기록 보관, 라벨링 의무를 다룹니다.
              </p>
              <p>
                본 서비스는 이용자가 업로드한 작품을 호스팅하는 온라인 플랫폼입니다. 이 페이지는 서비스의 일반적인 운영
                방식과, 본 서비스에 게시되는 작품 유형을 기준으로 한 기본 입장을 설명하기 위한 것입니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="platform-role">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">2. 플랫폼의 역할</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                본 서비스는 이용자 제출 자료를 저장, 전송, 표시, 검색, 인덱싱하는 플랫폼으로 운영됩니다. 본 서비스는
                제3자가 업로드한 작품에 대해 출연자를 섭외하거나, 고용하거나, 촬영을 지시하거나, 제작에 관여하지
                않습니다.
              </p>
              <p>
                따라서 본 서비스는 통상적인 운영 범위에서 제3자 제출 콘텐츠의 원 제작자 또는 출연자 관리 주체가 아니며,
                단순 호스팅만으로 제3자 작품의 기록관리 책임자(custodian of records)로 지정되는 것은 아닙니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="non-real-person">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              3. 실제 사람이 아닌 작품
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                본 서비스에 게시되는 작품의 대부분은 웹툰, 만화, 동인지, 일러스트 등 실제 인간을 묘사하지 않는 창작물
                또는 비사진적 표현물입니다.
              </p>
              <p>
                이러한 작품은 실제 인간의 시각적 묘사에 관한 기록 보관 제도를 전제로 하는 18 U.S.C. §2257, §2257A 및 28
                C.F.R. Part 75의 일반적인 적용 대상이 아닙니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="real-person">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">
              4. 실제 사람이 등장하는 예외 콘텐츠
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                예외적으로 실제 성인이 등장하는 제3자 업로드 콘텐츠가 게시될 수 있습니다. 본 서비스는 미성년자가
                등장하는 실제 인물 콘텐츠의 업로드를 허용하지 않습니다.
              </p>
              <p>
                업로더 또는 원 콘텐츠 제공자가 실제 인간이 등장하는 자료를 제출하는 경우, 해당 제출자는 모든 묘사 대상이
                제작 시점에 만 18세 이상이었는지 확인해야 하며, 관련 법률이 적용되는 경우 필요한 기록 보관 및 고지
                의무를 스스로 판단하고 이행해야 합니다.
              </p>
              <p>
                개별 작품에 대해 업로더가 별도의 2257 또는 2257A 고지를 제공하는 경우, 그 고지는 해당 작품에 관한 업로더
                제공 작품별 고지로 취급됩니다.
              </p>
            </div>
          </section>

          <section className="space-y-3" id="uploader-obligations">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">5. 업로더의 책임</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300 marker:text-zinc-600">
              <li>
                실제 인간이 등장하는 자료를 업로드하는 경우, 업로더는 해당 자료에 법률상 기록 보관 의무가 적용되는지
                직접 확인해야 합니다.
              </li>
              <li>
                적용되는 경우, 업로더 또는 원 콘텐츠 제공자는 연령 확인, 기록 보관, 작품별 식별 정보 및 필요한 고지
                문구를 직접 유지해야 합니다.
              </li>
              <li>
                업로더는 미성년자가 등장하는 실제 인물 자료를 업로드해서는 안 되며, 허위 또는 불완전한 준수 정보를
                제공해서도 안 됩니다.
              </li>
              <li>
                본 서비스는 개별 업로더의 법률 자문을 대신하지 않으며, 업로더는 필요한 경우 미국 법률 자문을 직접 받아야
                합니다.
              </li>
            </ul>
          </section>

          <section className="space-y-3" id="requests">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">6. 문의 및 조치</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>
                본 서비스는 적용 법률,{' '}
                <Link
                  className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                  href="/doc/terms"
                  prefetch={false}
                >
                  이용약관
                </Link>
                ,{' '}
                <Link
                  className="underline underline-offset-4 text-zinc-200 hover:text-zinc-100"
                  href="/doc/dmca"
                  prefetch={false}
                >
                  저작권/DMCA 절차
                </Link>
                , 및 내부 정책에 따라 필요 시 콘텐츠 삭제, 접근 제한, 추가 정보 요청 또는 계정 조치를 할 수 있습니다.
              </p>
              <p>
                2257 또는 2257A 관련 문의는 대상 URL, 작품 제목, 업로더 식별 정보, 문제되는 사유를 포함하여 아래
                이메일로 보내주시기 바랍니다.
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

          <section className="space-y-3" id="changes">
            <h2 className="scroll-mt-24 text-xl font-semibold tracking-tight text-zinc-100">7. 변경</h2>
            <p className="text-sm leading-relaxed text-zinc-300">
              본 안내는 법령 해석, 서비스 운영 구조, 제출 정책 또는 실무 절차의 변경에 따라 수정될 수 있습니다.
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
