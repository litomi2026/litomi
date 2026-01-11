import type { Metadata } from 'next'

import InstallPrompt from '@/components/InstallPrompt'
import { env } from '@/env/client'

export const metadata: Metadata = {
  title: '앱 설치하기',
  description: 'Android는 APK나 PWA로, iOS는 PWA(또는 TestFlight)로 설치해요.',
}

const ANDROID_APK_URL = 'https://github.com/gwak2837/litomi/releases/latest/download/litomi.apk'
const ANDROID_APK_SHA256_URL = `${ANDROID_APK_URL}.sha256`

const { NEXT_PUBLIC_IOS_TESTFLIGHT_URL } = env

export default function AppInstallPage() {
  return (
    <div className="mx-auto max-w-prose p-safe">
      <header className="grid gap-2 pt-4 sm:pt-10">
        <h1 className="text-xl font-bold tracking-tight">앱 설치하기</h1>
        <p className="text-sm text-zinc-400">
          Android는 APK나 PWA로 설치할 수 있고, iOS는 보통 PWA(홈 화면에 추가)로 설치하는 게 가장 간편해요.
        </p>
      </header>

      <main className="mt-6 grid gap-3">
        <section className="rounded-2xl border-2 border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-base font-semibold">Android (APK)</h2>
          <p className="mt-1 text-sm text-zinc-400">스토어 없이 APK로 설치할 수 있어요.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:brightness-95 active:brightness-90"
              href={ANDROID_APK_URL}
              rel="noreferrer"
              target="_blank"
            >
              APK 다운로드
            </a>
            <a
              className="inline-flex items-center justify-center rounded-xl border-2 border-zinc-800 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900 active:bg-zinc-950"
              href={ANDROID_APK_SHA256_URL}
              rel="noreferrer"
              target="_blank"
            >
              SHA-256
            </a>
          </div>

          <details className="group mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
              APK 설치가 좋은 점/아쉬운 점이 궁금해요
            </summary>
            <div className="mt-3 grid gap-3 text-sm text-zinc-300">
              <div>
                <p className="font-semibold text-zinc-200">좋은 점</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>브라우저 제약이 적어서 기능 확장이 쉬워요.</li>
                  <li>홈 화면/전체 화면 등 “진짜 앱” 느낌이 더 강해요.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-zinc-200">아쉬운 점</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>처음에 “알 수 없는 앱 설치” 권한을 허용해야 할 수 있어요.</li>
                  <li>네이티브 변경이 있으면 업데이트를 위해 다시 설치해야 해요.</li>
                </ul>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border-2 border-zinc-800 bg-zinc-950/60 p-4">
          <h2 className="text-base font-semibold">PWA (홈 화면에 추가)</h2>
          <p className="mt-1 text-sm text-zinc-400">
            설치가 빠르고, 웹 업데이트가 자동으로 반영돼요. 대신 기기/브라우저에 따라 일부 기능이 제한될 수 있어요.
          </p>
          <div className="mt-3">
            <InstallPrompt />
          </div>

          <details className="group mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <summary className="cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">
              PWA 설치가 좋은 점/아쉬운 점이 궁금해요
            </summary>
            <div className="mt-3 grid gap-3 text-sm text-zinc-300">
              <div>
                <p className="font-semibold text-zinc-200">좋은 점</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>설치가 간단하고, 웹 배포만으로 업데이트가 반영돼요.</li>
                  <li>iOS에서도 가장 현실적인 “설치” 방식이에요.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-zinc-200">아쉬운 점</p>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>기기/브라우저에 따라 동작이 조금씩 다를 수 있어요.</li>
                  <li>“진짜 앱”보다 기능/권한이 제한될 수 있어요.</li>
                </ul>
              </div>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border-2 border-zinc-800 bg-zinc-950/60 p-4" id="android-help">
          <h2 className="text-base font-semibold">Android 설치 방법</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
            <li>APK를 다운로드해요.</li>
            <li>설치가 막히면 “알 수 없는 앱 설치” 권한을 한 번만 허용해요.</li>
            <li>설치를 진행해요.</li>
          </ol>
        </section>

        {NEXT_PUBLIC_IOS_TESTFLIGHT_URL ? (
          <section className="rounded-2xl border-2 border-zinc-800 bg-zinc-950/60 p-4" id="ios-help">
            <h2 className="text-base font-semibold">iOS 설치 방법 (TestFlight 베타)</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
              <li>App Store에서 TestFlight를 설치해요.</li>
              <li>TestFlight 초대 링크를 열어요.</li>
              <li>TestFlight에서 설치 버튼을 눌러요.</li>
            </ol>
          </section>
        ) : null}
      </main>
    </div>
  )
}
