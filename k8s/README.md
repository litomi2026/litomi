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

sudo kubectl wait --for=condition=Ready node --all --timeout=20s
sudo kubectl -n kube-system wait --for=create deploy/traefik --timeout=20s
sudo kubectl -n kube-system rollout status deploy/traefik --timeout=20s

sudo kubectl get nodes
sudo kubectl -n kube-system get deploy traefik
```

### 3) Argo CD 설치

CRD 크기 때문에 **server-side apply**를 권장해요.

```zsh
sudo kubectl apply --server-side --force-conflicts -k k8s/bootstrap/argocd
sudo kubectl -n argocd rollout status deploy/argocd-server --timeout=120s
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

sudo kubectl -n cloudflared create secret generic cloudflared-token \
  --from-literal=token="eyJh..." \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

#### 비밀 환경변수 (`litomi-backend-secret`) - stg/prod 각각

**모범 사례: 여러 줄 값(인증서/키)은 `--from-file` 사용**

```zsh
sudo kubectl create namespace litomi-stg --dry-run=client -o yaml | sudo kubectl apply -f -
sudo kubectl create namespace litomi-prod --dry-run=client -o yaml | sudo kubectl apply -f -

sudo vi /tmp/litomi-backend-secret.prod.env
sudo vi /tmp/litomi-backend-secret.stg.env
sudo vi /tmp/aiven.crt
sudo vi /tmp/ga-key.pem
sudo vi /tmp/supabase.crt

sudo kubectl -n litomi-prod create secret generic litomi-backend-secret \
  --from-env-file=/tmp/litomi-backend-secret.prod.env \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n litomi-prod create secret generic litomi-backend-file \
  --from-file=AIVEN_CERTIFICATE=/tmp/aiven.crt \
  --from-file=GA_SERVICE_ACCOUNT_KEY=/tmp/ga-key.pem \
  --from-file=SUPABASE_CERTIFICATE=/tmp/supabase.crt \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n litomi-stg create secret generic litomi-backend-secret \
  --from-env-file=/tmp/litomi-backend-secret.stg.env \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n litomi-stg create secret generic litomi-backend-file \
  --from-file=AIVEN_CERTIFICATE=/tmp/aiven.crt \
  --from-file=GA_SERVICE_ACCOUNT_KEY=/tmp/ga-key.pem \
  --from-file=SUPABASE_CERTIFICATE=/tmp/supabase.crt \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# (확인) 인증서가 올바른 PEM 형식으로 저장되었는지 확인
sudo kubectl -n litomi-prod get secret litomi-backend-secret \
  -o jsonpath='{.data.SUPABASE_CERTIFICATE}' | base64 -d | head -n 2
```

### 5) GitOps 시작 (root app-of-apps 적용)

```zsh
sudo kubectl apply -f k8s/bootstrap/root/root.yaml

sudo kubectl -n argocd wait --for=jsonpath='{.status.sync.status}'=Synced applications.argoproj.io/root --timeout=60s
sudo kubectl -n argocd wait --for=jsonpath='{.status.health.status}'=Healthy applications.argoproj.io/root --timeout=60s

sudo kubectl -n argocd get applications.argoproj.io
```

### 6) 접속 확인 (stg/prod)

- **stg web**: `https://stg.litomi.in`
- **stg api**: `https://api-stg.litomi.in/health`
- **prod web**: `https://litomi.in`
- **prod api**: `https://api.litomi.in/health`
- **Argo CD**: `https://argocd.litomi.in`

### 참고

- [Kubernetes 프로덕션 환경 고려사항](https://kubernetes.io/ko/docs/setup/production-environment/)
- [HPA(수평 파드 오토스케일링)](https://kubernetes.io/ko/docs/tasks/run-application/horizontal-pod-autoscale/)
- [컨테이너 리소스 관리(requests/limits)](https://kubernetes.io/ko/docs/concepts/configuration/manage-resources-containers/)
- [리소스 메트릭 파이프라인(metrics-server 포함)](https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/)
- [metrics-server(공식 SIGs 프로젝트)](https://github.com/kubernetes-sigs/metrics-server)
- [Secret(비밀값)](https://kubernetes.io/ko/docs/concepts/configuration/secret/)
- [Security Context(권한/보안 설정)](https://kubernetes.io/ko/docs/tasks/configure-pod-container/security-context/)
- [ServiceAccount(서비스 계정)](https://kubernetes.io/ko/docs/concepts/security/service-accounts/)
- [Argo CD Declarative Setup(공식 문서)](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/)
- [Argo CD AppProject(공식 문서)](https://argo-cd.readthedocs.io/en/stable/user-guide/projects/)

## 디버그

### Traefik 포트포워드로 Ingress 라우팅 확인

```zsh
sudo kubectl -n kube-system port-forward svc/traefik 8080:80

curl -I -H 'Host: stg.litomi.in' http://127.0.0.1:8080/
curl -I -H 'Host: api-stg.litomi.in' http://127.0.0.1:8080/health
curl -I -H 'Host: litomi.in' http://127.0.0.1:8080/
curl -I -H 'Host: api.litomi.in' http://127.0.0.1:8080/health
curl -I -H 'Host: argocd.litomi.in' http://127.0.0.1:8080/
```
