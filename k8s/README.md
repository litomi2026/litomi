## k3s(arm64) + Argo CD(GitOps) + metrics-server + HPA로 Litomi 올리기 (OrbStack Ubuntu)

이 문서는 **온프레미스(Apple Silicon) + OrbStack Ubuntu(arm64)**에서:

- `k3s` 설치
- `Argo CD` 설치/부트스트랩
- `metrics-server` 설치
- `HPA`로 replica 자동 확장
- Litomi(`web` + `backend` + `edge proxy`) 배포

까지 “처음부터 끝까지” 따라갈 수 있게 만든 가이드예요.

## 구성(요약)

- **Web(Prod, main)**: `litomi.in`
- **API Domain(Prod, main)**: `api.litomi.in`
  - `/api/v1/*` → `litomi-backend`(Hono)
- **External API Proxy(Vercel)**: `vercel.litomi.in`
  - `/api/proxy/*` (Next.js Edge route handlers)
- **Ingress**: k3s 기본 `Traefik`
- **Autoscaling**: `metrics-server` + `HPA`

> Cloudflare Tunnel(connector = `cloudflared`)은 **k3s 클러스터 안에서(Argo CD로) 실행**하고, origin은 `traefik.kube-system.svc.cluster.local:80`로 붙여요.  
> 그래서 Cloudflare → cloudflared → Traefik → Ingress 라우팅으로 동작해요.

## 0) 준비물

- OrbStack Ubuntu 머신(arm64)
- `git`, `curl`, `docker` 사용 가능
- (권장) Cloudflare Tunnel + DNS를 이미 설정했거나, 설정할 계획

## 1) Ubuntu에서 레포 클론

```bash
git clone https://github.com/gwak2837/litomi.git
cd litomi
```

## 2) k3s 설치

```bash
sudo sh scripts/orbstack/bootstrap-k3s.sh
```

설치 확인:

```bash
kubectl get nodes
kubectl get pods -A | head
```

## 3) (필수) Litomi 이미지 준비 (GHCR pull 권장)

기본은 GitHub Actions가 이미지를 **GHCR**로 푸시하고, k8s overlay가 그 이미지를 쓰게 되어 있어요.  
그래서 보통은 **로컬 빌드/import 없이** 그대로 진행하면 돼요.

- prod: `k8s/apps/litomi/overlays/prod/kustomization.yaml`
  - `ghcr.io/gwak2837/litomi-web:main`
  - `ghcr.io/gwak2837/litomi-backend:main`
- stg: `k8s/apps/litomi/overlays/stg/kustomization.yaml`
  - `ghcr.io/gwak2837/litomi-web:stage`
  - `ghcr.io/gwak2837/litomi-backend:stage`

> `vercel/`(Edge proxy)은 **k3s에 올리지 않아요.** Vercel에서 따로 운영해요.

### 3-3) (필수) Secret 준비 (Git에 저장하지 않아요)

Litomi 배포에는 아래 Secret이 필요해요(민감값이라 Git에 커밋하지 않아요):

- `litomi-backend-secret` (Backend/Web 공통): `POSTGRES_URL*` (Supabase 등 외부 DB), 기타 민감값

> 참고: Redis는 클러스터 안에 하나만 띄우고(`redis`), backend ConfigMap에는 `REDIS_URL=redis://redis:6379`가 들어가요.

템플릿:

- `k8s/apps/litomi/overlays/litomi-backend-secret.env.template`

prod에서는 `src/env/server.common.ts`, `src/env/server.hono.ts`, `src/env/server.next.ts`에 있는 런타임 env를 **빠짐없이 채우는 걸 권장**해요.

Prod 예시:

```bash
cp k8s/apps/litomi/overlays/litomi-backend-secret.env.template /tmp/litomi-backend-secret.env
# 파일을 열어서 CHANGE_ME / <...> 부분을 채워요.

NAMESPACE=litomi-prod sh scripts/orbstack/set-litomi-backend-secret.sh /tmp/litomi-backend-secret.env
```

staging도 똑같이 `NAMESPACE=litomi-stg`로 한 번 더 실행하면 돼요.

> 참고: Secret 값이 바뀌면 backend는 자동으로 재시작되지 않을 수 있어요.  
> 필요하면 `kubectl -n <ns> rollout restart deploy/litomi-backend` 해주면 돼요.

## 4) Argo CD 설치

```bash
sudo sh scripts/orbstack/install-argocd.sh
```

Argo CD UI는(간단히) 포트포워딩으로 볼 수 있어요:

```bash
kubectl -n argocd port-forward svc/argocd-server 3010:443
```

그리고 브라우저에서 `https://localhost:3010`로 접속하면 돼요.

초기 비밀번호:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

## 5) Argo CD에 “이 레포”를 부트스트랩(앱 생성)

> 레포가 public이면 그대로 되고, private이면 Argo CD에 repo credential을 먼저 넣어야 해요.

```bash
sh scripts/orbstack/bootstrap-argocd-apps.sh
```

생성되는 앱:

- `platform-metrics-server`
- `platform-cloudflared` (Cloudflare Tunnel connector)
- `litomi-stg` (stage 브랜치, `stg.*` / `api-stg.*`)
- `litomi-prod` (main 브랜치, `litomi.in` / `api.litomi.in`)

확인:

```bash
kubectl -n argocd get applications
```

## 6) 동작 확인

```bash
kubectl -n litomi-prod get pods
kubectl -n litomi-prod get ingress
```

HPA 확인:

```bash
kubectl -n litomi-prod get hpa
kubectl top pods -n litomi-prod
```
