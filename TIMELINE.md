# 기록

## 장애

#### 2025-09-05 14:37 ~ 15:58 (GMT+9)

- 지속: 1시간 21분
- 내용: Edge Function Invocation > 503 Service Unavailable
- 영향
  - `/api/proxy/manga`
    - Osaka, Japan (kix1) 15:31
  - `/api/proxy/manga/[id]`
    - Osaka, Japan (kix1) 14:37 ~ 15:57
    - Singapore (sin1) 15:57 ~ 15:58
- 조치: 없음 (사후에 인지함)
- 분석
  - 방화벽에 같은 날 14:30 ~ 16:00 challenge 기록 남음
  - 한 번 발생한 오류는 1~2분 안에 끝남
  - 1~2분 동안 특정 path에만 오류가 발생함
- 원인: DoS 공격? (외부 API 장애는 아님)
- 해결: WAF로 해당 요청 IP/JA4/user-agent 차단

#### 2025-09-02 01:00 ~ 2025-09-05 19:59 (GMT+9)

- 지속: 3일 19시간
- 내용: Error: Failed query: insert into "manga_seen" ...
- 영향: 알림 테이블에 신작 알림이 중복으로 생성됨
- 조치: Cloud Run job 알림 작업 일시 중지
- 원인: 데이터베이스 스키마 불일치
- 해결: Cloud Run job 재배포

#### 2025-09-04 22:26 ~ 22:53 (GMT+9)

- 지속: 27분
- 내용: [PostgresError]: Unable to check out process from the pool due to timeout
- 원인: ?

#### 2025-09-01 22:09 ~ 23:16 (GMT+9)

- 지속: 1시간 7분
- 내용: [PostgresError]: Unable to check out process from the pool due to timeout
- 영향
  - 로그인, 회원가입 등 계정 관련 전부
  - 북마크, 서재 등 회원 관련 기능 전부
- 조치: Cloudflare Under Attack Mode 활성화
- 원인
  - Supabase Pooler to Database connections 15 -> 5 -> 16
  - Supabase와 Next.js 간 연결이 닫히지 않아 일시적으로 많아짐
- 해결: Session pooler 방식 삭제

#### 2025-09-01 20:01 ~ 20:38 (GMT+9)

- 지속: 37분
- 내용: 일부 소스의 이미지를 불러올 수 없음
- 영향: 일부 뷰어에서 404 페이지가 보이면 안 되는데 보임
- 원인: Vercel Edge config 설정 오타
- 해결: 오타 수정
