# litomi

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/litomi) [![Netlify Status](https://api.netlify.com/api/v1/badges/4efb3532-1a78-4c0e-a848-e2c7d29c8e39/deploy-status)](https://app.netlify.com/projects/litomi/deploys)

## 개발 환경

- macOS 15.3
- Bun 1.2

## 시작하기

프로젝트 의존 패키지 설치하기

```bash
bun i
```

개발 서버 실행하기

```bash
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 주소 열어서 결과 보기

## 도메인

- 유료: https://litomi.in
- Vercel: https://litomi.vercel.app
- Render: https://litomi.onrender.com
- Netlify: https://litomi.netlify.app
- sherpa.io: https://litomi.sherpa.software
- Fly.io: https://litomi.fly.dev
- Deno: https://litomi.deno.dev (로그인 안 됨)

## 목적

본 프로젝트로 여타 만화 사이트가 이용자에게 해를 끼치는 불법 도박, 피싱, 스캠, 성인 광고로 수익을 창출하는 것을 방지하려고 해요. 그래서 해당 사이트의 만화 작품을 수집하여 다수의 사용자에게 즐거움을 제공하기 위해 코드를 항상 공개하여 오픈 소스로 운영할 거에요. 본 프로젝트는 앞으로도 불법 광고를 통해 수익을 창출하지 않을 거에요.

## 메모

`<Suspense clientOnly>`

- 조건: `/api/*` 호출하는 hook을 가지는 컴포넌트
- 이유: `domain/path` 형태로 호출해야 하는데 귀찮아서`/path` 형태로 호출하고 있음

`<Suspense>`

- 조건: useSearchParams hook을 가지면서 서버에서 실행되는 컴포넌트
- 이유: Next.js 에서 강제함
