# litomi

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/litomi) [![Netlify Status](https://api.netlify.com/api/v1/badges/4efb3532-1a78-4c0e-a848-e2c7d29c8e39/deploy-status)](https://app.netlify.com/projects/litomi/deploys)

## 목적

본 프로젝트로 여타 만화 사이트가 이용자에게 해를 끼치는 도박, 성인, 약물, 암호화폐, 스캠, 피싱 광고로 수익을 창출하는 것을 방지하려고 해요. 그래서 해당 사이트의 만화 작품을 수집하여 다수의 사용자에게 즐거움을 제공하기 위해 코드를 항상 공개하여 오픈 소스로 운영할 거에요. 본 프로젝트는 앞으로도 앞에서 언급한 종류의 광고를 통해 수익을 창출하지 않을 거에요.

## 기능

- 뷰어
  - 터치보기, 스크롤보기
  - 한 쪽 보기, 두 쪽 보기
  - 상하 넘기기, 좌우 넘기기
  - 상하 스와이프로 밝기 조절
  - 좌우 스와이프로 페이지 넘기기
  - 이미지 레이아웃 조정
  - 슬라이드쇼
  - 마지막 감상 페이지부터 이어서 보기
  - 터치보기: 스크롤로 페이지 넘기기
  - 터치보기: meta + 스크롤로 이미지 확대
  - 스크롤보기: 이미지 너비 조절
- 태그 한글 번역
- 북마크
- 감상 기록
- 인기 검색어
- 최근 검색어
- 키워드 알림
- 웹 푸시 알림
- 키워드로 작품 검열
- 서재: 북마크 폴더별 정리
- 조회수/북마크 등의 기간별 인기 순위
- 실시간 인기 페이지 순위 (Google Analytics Data API)
- 패스키 로그인
- 2단계 인증 (TOTP)
- 회원가입, 로그인

## 개발 환경

- macOS 15.6
- Bun 1.3
- Docker 28.1
- PostgreSQL(psql) 17.5

## 시작하기

#### Next.js

프로젝트 의존 패키지 설치하기

```bash
bun i
```

환경 변수 설정하기

```bash
cp -i .env.template .env.development
```

개발 서버 실행하기

```bash
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 주소 열어서 결과 보기

#### Backend

```
docker build . -t litomi-backend
docker run -e PORT=4000 -p 4000:4000 --rm litomi-backend:latest
```

## 링크

#### 배포

- 인도 도메인: https://litomi.in
- Vercel: https://litomi.vercel.app
- Netlify: https://litomi.netlify.app
- Fly.io: https://litomi.fly.dev
- Render: https://litomi.onrender.com
- sherpa.io: https://litomi.sherpa.software

#### 기타

- SonarQube: https://sonarcloud.io/summary/overall?id=gwak2837_litomi&branch=main
- Discord: https://discord.gg/xTrbQaxpyD
- X: https://x.com/litomi_in

## 고민

#### 비용

- [Fluid Active CPU](https://vercel.com/docs/fluid-compute/pricing) 수치를 낮추기 위해 서버 컴포넌트엔 SSG, ISR 기술을 적용하고 route handler 응답엔 cache-control 헤더를 설정함
- `<Link>` 컴포넌트의 prefetch 기능이 너무 많은 [Function Invocations](https://vercel.com/docs/functions/usage-and-pricing)을 유발함 -> 작품 카드에선 비활성화함
- WAF 설정이 너무 많은 [Firewall Rate Limit Requests
  ](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing#priced-features-usage)를 유발함 -> WAF path 조건을 세분화함

#### 프록시

- 외부 API 장애 시 일시적 장애는 exponentialBackoff 방식으로 대응하고, 지속적 장애는 CircuitBreaker 방식으로 대응함
- edge 환경에 배포함
