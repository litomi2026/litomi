## k3s + Argo CD + Cloudflare Tunnel

- `k8s/bootstrap/`: **처음 1번만** 사람이 `kubectl apply`로 넣는 “시드(bootstrap)”예요.
- `k8s/platform/`, `k8s/apps/`: Argo CD가 GitOps로 계속 맞춰주는 “목표 상태(desired state)”예요.

### 1) 레포 받기

```zsh
sudo apt update
sudo apt install -y git

git clone https://github.com/gwak2837/litomi.git
cd litomi
```

### 2) k3s 설치

```zsh
curl -sfL https://get.k3s.io | sudo sh -

sudo kubectl get nodes
sudo kubectl -n kube-system get deploy traefik
```

### 3) Argo CD 설치

CRD 크기 때문에 **server-side apply**를 권장해요.

```zsh
sudo kubectl apply --server-side --force-conflicts -k k8s/bootstrap/argocd
sudo kubectl -n argocd rollout status deploy/argocd-server
```

#### (선택) 초기 admin 비밀번호 확인

```zsh
sudo kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

### 4) (필수) Secret 준비

#### Cloudflare Tunnel 토큰 (`cloudflared-token`)

```zsh
sudo kubectl create namespace cloudflared --dry-run=client -o yaml | sudo kubectl apply -f -

# TOKEN= 에 Cloudflare Tunnel token을 넣어주세요
TOKEN='PASTE_YOUR_TUNNEL_TOKEN_HERE'

sudo kubectl -n cloudflared create secret generic cloudflared-token \
  --from-literal=token="$TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Litomi 백엔드 환경변수 (`litomi-backend-secret`) - stg/prod 각각

```zsh
sudo kubectl create namespace litomi-stg --dry-run=client -o yaml | sudo kubectl apply -f -
sudo kubectl create namespace litomi-prod --dry-run=client -o yaml | sudo kubectl apply -f -

cp k8s/apps/litomi/secrets/backend-secret.env.template /tmp/litomi-backend-secret.stg.env
cp k8s/apps/litomi/secrets/backend-secret.env.template /tmp/litomi-backend-secret.prod.env

# 두 파일을 열어서 각각 값들을 채워주세요 (POSTGRES_URL 등)

sudo kubectl -n litomi-stg create secret generic litomi-backend-secret \
  --from-env-file=/tmp/litomi-backend-secret.stg.env \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n litomi-prod create secret generic litomi-backend-secret \
  --from-env-file=/tmp/litomi-backend-secret.prod.env \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

### 5) GitOps 시작 (root app-of-apps 적용)

```zsh
sudo kubectl apply -f k8s/bootstrap/root/root.yaml
sudo kubectl -n argocd get applications.argoproj.io
```

### 6) 접속 확인 (stg/prod)

- **stg web**: `https://stg.litomi.in`
- **stg api**: `https://api-stg.litomi.in/health`
- **prod web**: `https://litomi.in`
- **prod api**: `https://api.litomi.in/health`
- **Argo CD**: `https://argocd.litomi.in`

#### (디버그) Traefik 포트포워드로 Ingress 라우팅 확인

```zsh
sudo kubectl -n kube-system port-forward svc/traefik 8080:80

curl -I -H 'Host: stg.litomi.in' http://127.0.0.1:8080/
curl -I -H 'Host: api-stg.litomi.in' http://127.0.0.1:8080/health
curl -I -H 'Host: litomi.in' http://127.0.0.1:8080/
curl -I -H 'Host: api.litomi.in' http://127.0.0.1:8080/health
curl -I -H 'Host: argocd.litomi.in' http://127.0.0.1:8080/
```
