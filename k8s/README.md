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

#### Argo CD 초기 admin 비밀번호 확인

```zsh
sudo kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

### 4) Secret 준비

#### Cloudflare Tunnel 토큰

```zsh
sudo kubectl create namespace cloudflared --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n cloudflared create secret generic cloudflared-token \
  --from-literal=token="eyJh..." \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

#### 비밀 환경변수 - stg/prod 각각

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

#### (선택) Grafana Cloud remote_write

`kube-prometheus-stack`(Prometheus Operator)로 **클러스터 내부에서 메트릭을 수집**하고,
Grafana Cloud를 쓴다면 **remote_write로 메트릭을 Grafana Cloud로 푸시**할 수 있어요.

```zsh
sudo kubectl create namespace monitoring --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n monitoring create secret generic grafana-cloud-remote-write \
  --from-literal=username='<Grafana Cloud instance ID>' \
  --from-literal=password='<Grafana Cloud API token>' \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

#### (선택) Discord 알림 webhook

```zsh
sudo kubectl -n monitoring create secret generic alertmanager-discord-webhook-warning \
  --from-literal=url="https://discord.com/api/webhooks/..." \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n monitoring create secret generic alertmanager-discord-webhook-critical \
  --from-literal=url="https://discord.com/api/webhooks/..." \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

### 5) GitOps 시작 (root app-of-apps 적용)

```zsh
sudo kubectl apply -f k8s/bootstrap/root/root.yaml

sudo kubectl -n argocd wait --for=jsonpath='{.status.sync.status}'=Synced applications.argoproj.io/root --timeout=60s
sudo kubectl -n argocd wait --for=jsonpath='{.status.health.status}'=Healthy applications.argoproj.io/root --timeout=60s

sudo kubectl -n argocd get applications.argoproj.io
```

### 6) 접속 확인

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
- [Prometheus Operator(공식)](https://prometheus-operator.dev/)
- [Alertmanager(공식)](https://prometheus.io/docs/alerting/latest/alertmanager/)

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

### HPA가 왜 동작/미동작하는지

HPA(CPU `averageUtilization`)는 **Pod의 CPU 사용량**을 **CPU request 대비 퍼센트**로 계산해요. 그래서 아래 2개가 없으면(또는 이상하면) 동작이 흔들릴 수 있어요.

- **(필수) metrics-server / Metrics API**: `kubectl top`이 되는지 먼저 봐요.
- **(필수) `resources.requests.cpu`**: HPA의 “기준선(baseline)”이라서, 없으면 퍼센트 계산이 불가능해요.

#### 1) metrics-server가 살아있는지 확인

```zsh
# Metrics API가 등록됐는지(AVAILABLE=True)
sudo kubectl get apiservice v1beta1.metrics.k8s.io

# 실제로 메트릭이 찍히는지
sudo kubectl top nodes
sudo kubectl top pods -n litomi-prod
sudo kubectl top pods -n litomi-stg
```

#### 2) HPA가 뭘 보고 스케일링 판단하는지 확인

```zsh
sudo kubectl -n litomi-prod get hpa
sudo kubectl -n litomi-prod describe hpa litomi-web
sudo kubectl -n litomi-prod describe hpa litomi-backend
```

아래 같은 이벤트가 보이면 원인을 바로 좁힐 수 있어요.

- **`FailedGetResourceMetric`**: metrics-server 문제이거나, kubelet 접근/인증/주소 플래그 문제일 때가 많아요.
- **`missing request for cpu`**: 해당 Deployment 컨테이너에 `resources.requests.cpu`가 없을 때예요.

#### 3) “스케일링은 하는데 Pod가 늘지 않아요”인 경우(스케줄링)

```zsh
sudo kubectl -n litomi-prod get pods
sudo kubectl -n litomi-prod describe pod <PENDING_POD_NAME>
```

`Insufficient cpu/memory` 같은 이벤트가 뜨면 **노드 자원이 부족해서** 새 Pod를 못 올리는 거예요. 이 경우는 HPA YAML만으로는 해결이 안 되고, 보통 아래 중 하나가 필요해요.

- **requests/limits 조정(측정 기반으로)**
- **노드 증설(클러스터 오토스케일러 포함)**

### Monitoring 동작 확인

```zsh
# Prometheus UI
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090

# Targets / Rules / Alerts 확인
open http://127.0.0.1:9090/targets
open http://127.0.0.1:9090/rules
open http://127.0.0.1:9090/alerts
```

```zsh
# Alertmanager UI (알림 그룹핑/억제/사일런스 확인)
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
open http://127.0.0.1:9093/#/alerts
```
