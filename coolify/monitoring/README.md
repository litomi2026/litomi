# Monitoring (Coolify)

Coolify 위에서 Prometheus/Grafana 기반으로 **서버/컨테이너 상태 + HTTP 업타임 + Discord 알림**을 운영하기 위한 구성 파일들이에요.

## 구성 요소

- **Grafana**: 대시보드 UI (외부 공개: `grafana.<domain>`)
- **Prometheus**: 메트릭 수집/룰 평가
- **Alertmanager**: 알림 라우팅
- **Blackbox Exporter**: HTTP(S) 업타임 체크
- **Node Exporter**: 호스트(CPU/RAM/Disk 등) 메트릭
- **cAdvisor**: Docker 컨테이너 메트릭
- **alertmanager-discord(브릿지)**: Alertmanager Webhook을 받아 Discord로 보내는 릴레이 (Discord 웹훅을 env로 받아요)

## 배포 방법 (Coolify)

- **Projects → New**: `monitoring`
- **Add Resource → Docker Compose**
  - **Base Directory**: `coolify/monitoring`
  - Compose 파일: `docker-compose.yml`
- **Environment Variables(Secrets 권장)**에 아래 값을 넣고 Deploy 해요.

## 필요한 환경변수

`.env.template`를 참고해서 Coolify에 등록해 주세요.

- **`GRAFANA_ADMIN_PASSWORD`**: Grafana 관리자 비밀번호
- **`DISCORD_WEBHOOK`**: Discord Webhook URL (예: `https://discord.com/api/webhooks/.../...`)
- **`DISCORD_USERNAME`**: Discord에 표시될 봇 이름 (기본값: `alertmanager`)

## Cloudflare Tunnel 연동

이 레포의 Terraform(`cloudflare/terraform/`)에서 `grafana.<domain>`을 Tunnel ingress + DNS CNAME으로 붙이는 구성을 이미 추가했어요.

즉, 지금 self-host 트래픽 경로와 동일하게:

- Cloudflare Tunnel → `localhost:80` → `coolify-proxy`(Traefik) → `grafana`

로 접속돼요.

## 업타임(헬스체크) 대상 추가/수정

Prometheus 설정 파일의 `blackbox-https` job에서 `targets`를 수정하면 돼요.

- 파일: `prometheus/prometheus.yml`
- 기본 예시: `local/api-local/stg/api-stg/coolify`

## Traefik(= coolify-proxy) 요청 수/트래픽(메트릭) 보기

요청 수(초당 요청, 상태코드, 지연시간, 바이트 등)를 보려면 **Traefik Prometheus metrics**를 켜야 해요.

### 1) Traefik metrics 활성화

Coolify 서버에서 `coolify-proxy`(Traefik) 설정에 아래 옵션을 추가해 주세요.

- **추가할 flags**:
  - `--entrypoints.metrics.address=:8082`
  - `--metrics.prometheus=true`
  - `--metrics.prometheus.entrypoint=metrics`

### 2) Prometheus scrape

이 레포의 `prometheus/prometheus.yml`에 `job_name: traefik`가 포함돼 있어요.

정상 동작 확인은 Prometheus에서 아래 쿼리가 값이 나오는지 보면 돼요:

- `traefik_entrypoint_requests_total`
- `traefik_service_requests_total`

### 3) Grafana 대시보드 Import

Grafana에서 **Dashboard ID `17346`**(Traefik Official Standalone Dashboard)을 Import하면 요청 수/트래픽을 바로 볼 수 있어요.

## 알림(Discord)

현재 알림은 **Alertmanager → (webhook) → alertmanager-discord → Discord** 흐름이에요.

- 알림 룰: `prometheus/alert_rules.yml`
- Alertmanager 설정: `alertmanager/alertmanager.yml`
- Discord 브릿지 컨테이너: `docker-compose.yml`의 `alertmanager-discord`

### 기본 운영 알림(운영용 세트)

`prometheus/alert_rules.yml`에는 업타임 알림 외에도 아래 “기본 운영 알림”이 포함돼요.

- **디스크 여유 공간**: 15% 미만(warning, 30m), 5% 미만(critical, 15m)
- **디스크 inode 여유**: 10% 미만(warning, 30m), 5% 미만(critical, 15m)
- **메모리 여유(MemAvailable)**: 15% 미만(warning, 10m), 5% 미만(critical, 5m)
- **스왑 여유**: 25% 미만(warning, 10m), 10% 미만(critical, 5m) (스왑이 있을 때만)
- **OOM kill(호스트)**: 최근 10분 OOM kill 감지(critical)
- **컨테이너 크래시루프**: 15분 동안 3회 이상 재시작 감지(critical)
- **컨테이너 OOM**: 최근 10분 OOM 이벤트 감지(critical)
- **Exporter down**: node-exporter / cAdvisor / blackbox-exporter down (warning)
