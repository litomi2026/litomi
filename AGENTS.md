# AGENTS.md

## Collaboration

- 도중에 결정이 필요하거나 애매한 부분이나 맥락을 모르거나 궁금한 점이 있으면 먼저 질문한다.
- 이 repo의 아키텍처 기본값을 바꾸는 변경은 사용자 확인 없이 진행하지 않는다.
- 구조 변경 전에는 관련 문서를 먼저 읽고, 문서와 충돌하면 먼저 질문한다.

## Repo Rules

- 이 repository는 public repo다.
- 커밋되는 모든 파일은 공개될 수 있다고 가정한다.
- secret, token, private key, credential, 계정 정보, 민감한 운영 정보는 커밋하지 않는다.

## Web Rules

- `apps/web`는 App Router + Server Components + Tailwind를 사용한다.
- Next.js는 HTML 서버로만 사용한다.
- Next API route는 probe 정도만 허용한다.
- Server Action은 사용하지 않는다.
- 로직은 먼저 호출부 근처에 두고, 두 군데 이상에서 재사용될 때만 공용 폴더로 승격한다.

## DB Boundary

- PostgreSQL + Drizzle를 사용한다.
- Drizzle migration 파일은 사용하지 않고 `drizzle-kit push`만 사용한다.
