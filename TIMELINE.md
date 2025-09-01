# 기록

## 장애

#### 2025-09-01 22:09 ~ 23:16 (GMT+9)

- 지속: 1시간 7분
- 내용: [PostgresError]: Unable to check out process from the pool due to timeout
- 원인:
  - Supabase Pooler to Database connections 15 -> 5 -> 16
  - Cloudflare Under Attack Mode 활성화
- 해결:

#### 2025-09-01 20:01 ~ 20:38 (GMT+9)

- 지속: 37분
- 내용: 일부 소스의 이미지를 불러올 수 없음
- 원인: Vercel edge config 설정 오타
- 해결: 오타 수정
