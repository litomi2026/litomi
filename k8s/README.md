## k3s(arm64) + Argo CD(GitOps) + metrics-server + HPA로 Litomi 올리기 (OrbStack Ubuntu)

이 문서는 **온프레미스(Apple Silicon) + OrbStack Ubuntu(arm64)**에서:

- `k3s` 설치
- `Argo CD` 설치/부트스트랩
- `metrics-server` 설치
- `HPA`로 replica 자동 확장
- Litomi(`web` + `backend` + `edge proxy`) 배포

까지 “처음부터 끝까지” 따라갈 수 있게 만든 가이드예요.

---

## 구성(요약)

- **Web(Next.js)**: `local.litomi.in`
- **API Domain(단일 호스트)**: `api-local.litomi.in`
  - `/api/v1/*` → `litomi-backend`(Hono)
- **External API Proxy(Vercel)**: `vercel.litomi.in`
  - `/api/proxy/*` (Next.js Edge route handlers)
- **Ingress**: k3s 기본 `Traefik`
- **Autoscaling**: `metrics-server` + `HPA`

> Cloudflare Tunnel을 쓰면(이 레포 README 흐름 그대로) `local.*`, `api-local.*` DNS를 **Ubuntu VM의 `127.0.0.1:80`**로 붙일 수 있고, k3s Traefik가 그대로 받아서 라우팅해요.

---

## 0) 준비물

- OrbStack Ubuntu 머신(arm64)
- `git`, `curl` 사용 가능
- (권장) Cloudflare Tunnel + DNS를 이미 설정했거나, 설정할 계획

---

## 1) Ubuntu에서 레포 클론

```bash
git clone https://github.com/gwak2837/litomi.git
cd litomi
```

---

## 2) k3s 설치

```bash
sh scripts/orbstack/bootstrap-k3s.sh
```

설치 확인:

```bash
kubectl get nodes
kubectl get pods -A | head
```

---

## 3) (필수) Litomi 이미지 빌드 + k3s(containerd)로 import

이 구성은 기본적으로 `imagePullPolicy: IfNotPresent` + `IMAGE_TAG=local`(기본값) 태그를 써요.  
즉, **로컬에서 이미지를 빌드하고 k3s(containerd)에 import**해주면 바로 떠요.

### 3-1) 이미지 빌드

```bash
sh scripts/orbstack/build-images.sh
```

> `vercel/`(Edge proxy)은 **k3s에 올리지 않아요.** Vercel에서 따로 운영해요.

### 3-2) k3s로 import

```bash
sudo sh scripts/orbstack/import-images-k3s.sh
```

---

## 4) Argo CD 설치

```bash
sh scripts/orbstack/install-argocd.sh
```

Argo CD UI는(간단히) 포트포워딩으로 볼 수 있어요:

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

그리고 브라우저에서 `https://localhost:8080`로 접속하면 돼요.

초기 비밀번호:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

---

## 5) Argo CD에 “이 레포”를 부트스트랩(앱 생성)

> 레포가 public이면 그대로 되고, private이면 Argo CD에 repo credential을 먼저 넣어야 해요.

```bash
sh scripts/orbstack/bootstrap-argocd-apps.sh
```

생성되는 앱:

- `platform-metrics-server`
- `litomi-prod`

확인:

```bash
kubectl -n argocd get applications
```

---

## 6) 동작 확인

```bash
kubectl -n litomi get pods
kubectl -n litomi get ingress
```

HPA 확인:

```bash
kubectl -n litomi get hpa
kubectl top pods -n litomi
```

---

## (추가) Staging 환경(stg/api-stg)도 같이 올리기

staging은 아래처럼 분리돼 있어요:

- **Namespace**: `litomi-stg`
- **Web**: `stg.<domain>`
- **API**: `api-stg.<domain>`
- **Argo CD Application**: `litomi-stg` (Git `stage` 브랜치 추적)
 - **External API Proxy(Vercel)**: `vercel-stg.<domain>` (`/api/proxy/*`)

### 1) (중요) `stage` 브랜치에도 k8s 디렉토리가 있어야 해요

`k8s/argocd/bootstrap.yaml`의 `litomi-stg` 앱은 `targetRevision: stage`를 봐요.  
즉, `stage` 브랜치에도 `k8s/apps/litomi/overlays/stg`가 있어야 정상 동작해요.

### 2) stage 브랜치 코드로 이미지 빌드(+ import)

stage 브랜치를 별도 폴더로 클론해서 빌드하는 게 가장 단순해요.

```bash
cd ~
git clone -b stage https://github.com/gwak2837/litomi.git litomi-stage
cd litomi-stage

IMAGE_TAG=stg WEB_HOST=stg.litomi.in API_HOST=api-stg.litomi.in sh scripts/orbstack/build-images.sh
sudo IMAGE_TAG=stg sh scripts/orbstack/import-images-k3s.sh
```

> 참고: 같은 tag(`stg`)로 이미지를 다시 import해도 **파드가 자동으로 재시작되진 않아요.**  
> 새 이미지를 적용하려면:
>
> ```bash
> kubectl -n litomi-stg rollout restart deploy/litomi-web deploy/litomi-backend
> ```

### 3) Argo CD / k8s 확인

```bash
kubectl -n argocd get applications
kubectl -n litomi-stg get pods,ingress,hpa
```

## 7) (선택) 도메인 연결(Cloudflare Tunnel)

Cloudflare Tunnel은 **`127.0.0.1:80`(= k3s traefik ingress)** 로만 붙이면 돼요.

> 전제: k3s 기본 traefik가 호스트의 `:80`을 점유하고 있어야 해요.  
> 확인: `kubectl -n kube-system get svc traefik`

- `local.<domain>` → `http://127.0.0.1:80`
- `api-local.<domain>` → `http://127.0.0.1:80`

k3s Traefik가 Ingress로 라우팅해요.

> 참고: `vercel.<domain>` / `vercel-stg.<domain>`는 **Cloudflare Tunnel 대상이 아니고** Vercel 쪽으로 연결되는 도메인이에요.

### 방법 A) Cloudflare UI로 빠르게 붙이기(추천: 안전/빠름)

1) Cloudflare Zero Trust → **Tunnels** → **Create tunnel**
2) Public Hostname 2개 추가
   - `local.<domain>` → `http://127.0.0.1:80`
   - `api-local.<domain>` → `http://127.0.0.1:80`
3) Cloudflare가 DNS 레코드를 만들도록 하거나, 직접 CNAME을 추가해요
   - `local` / `api-local` → `<tunnel-id>.cfargotunnel.com` (proxied)
4) “Install connector” 화면에서 **token**을 복사해요
5) Ubuntu에서 cloudflared 실행:

```bash
sh scripts/orbstack/run-cloudflared.sh "<TOKEN>"
```

정상 확인:

```bash
curl -fsS http://127.0.0.1:2000/ready
```

### 방법 B) Terraform로 선언형(IaC)로 붙이기(주의: 존 전체 설정 포함)

이 레포의 `cloudflare/terraform/`는 self-host tunnel 뿐 아니라 **DNS/캐시룰/헤더/레이트리밋 등 존 설정을 같이 관리**해요.  
“터널만” 원하면 방법 A가 더 안전해요.

그래도 IaC로 가려면:

- `cloudflare/terraform/selfhost-tunnel.tf`에 이미
  - `local.<domain>`, `api-local.<domain>` → `http://127.0.0.1:80`
  설정이 들어 있어요.
- `terraform apply` 후 Cloudflare Zero Trust에서 tunnel connector token을 복사하고,
  Ubuntu에서 위 `run-cloudflared.sh`로 실행하면 돼요.

