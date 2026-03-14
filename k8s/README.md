## k3s + Argo CD + Cloudflare Tunnel

- `k8s/bootstrap/`: **처음 1번만** 사람이 `kubectl apply`로 넣는 “시드(bootstrap)”예요.
- `k8s/platform/`, `k8s/apps/`: Argo CD가 GitOps로 계속 맞춰주는 “목표 상태(desired state)”예요.

### 1) 레포 받기

```zsh
sudo apt-get -qq update >/dev/null
sudo apt-get -qq install -y git >/dev/null

git clone https://github.com/gwak2837/litomi.git
```

### 2) Vault seed 파일 준비

`k8s/platform-ops.sh`는 기본값으로 `./k8s/vault-secrets`를 읽어서 Vault KV를 채워요.
초기 1회 실행(`init`) 전에 아래 경로의 파일을 모두 준비해야 해요.

- `k8s/vault-secrets/**/*.env.example`

### 3) 초기 부트스트랩 자동화

```zsh
cd litomi
./k8s/platform-ops.sh
```

멀티홈 노드이거나 kubelet이 광고할 node IP를 명시해야 할 때만 `K3S_KUBELET_NODE_IP`를 설정하면 돼요.

```zsh
export K3S_KUBELET_NODE_IP="192.168.139.242,2001:db8::10"
./k8s/platform-ops.sh
```

Argo CD control plane bootstrap은 기본적으로 "없거나 깨졌을 때만" 재적용하고, 정상일 때는 전체 bootstrap 재적용을 건너뛰어요.
bootstrap 변경을 강제로 반영하려면 아래 옵션을 사용해요.

```zsh
./k8s/platform-ops.sh --force-argocd-bootstrap
```

기본 실행은 idempotent 하게 아래를 처리해요.

- k3s 설치/검증
- Argo CD bootstrap + root app 적용
- Vault TLS secret/CA configmap 정렬
- Vault init/unseal + kubernetes auth/kv/policy/role 구성
- `k8s/vault-secrets` 기반 Vault KV 시딩
- Argo CD 전체 Application Synced/Healthy 수렴 + ESO/필수 secret/public URL 점검
- 재부팅용 systemd 서비스(`litomi-platform-reboot.service`) 설치/활성화

### 5) 접속 확인

- **stg web**: `https://stg.litomi.in`
- **stg api**: `https://api-stg.litomi.in/health`
- **prod web**: `https://litomi.in`
- **prod api**: `https://api.litomi.in/health`
- **Argo CD**: `https://argocd.litomi.in`
- **Grafana**: `https://grafana.litomi.in`

```zsh
./k8s/platform-ops.sh --skip-public-check
```

### 자동 백업 / 재해 복구

`k8s/platform/velero/RUNBOOK.backup-dr.md` 참고

### 관측 (로그/트레이싱/블랙박스)

`k8s/platform/monitoring/RUNBOOK.logs-tracing-blackbox.md` 참고

### 공식 문서

- [Kubernetes 프로덕션 환경 고려사항](https://kubernetes.io/ko/docs/setup/production-environment/)
- [K3s 네트워크 옵션(공식 문서)](https://docs.k3s.io/networking/basic-network-options)
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
- [Blackbox exporter(공식)](https://prometheus.io/docs/guides/multi-target-exporter/)
- [OpenTelemetry Collector(공식)](https://opentelemetry.io/docs/collector/)
- [Grafana Loki / Tempo(공식)](https://grafana.com/docs/)
- [Velero(공식)](https://velero.io/docs/)

## 디버그

### Argo CD

admin 비밀번호

```zsh
sudo kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

Application 상태

```zsh
sudo kubectl -n argocd get applications.argoproj.io -o custom-columns='NAME:.metadata.name,SYNC:.status.sync.status,HEALTH:.status.health.status'

sudo kubectl -n argocd get ingress,svc,pods
```

개별 Application 상태

```zsh
sudo kubectl -n cloudflared get pods,deploy,svc,secret,externalsecret,secretstore
```

### Grafana

Grafana UI (로컬)

```zsh
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3010:80
open http://127.0.0.1:3010
```

Grafana 계정 정보

```zsh
sudo kubectl -n monitoring get secret kube-prometheus-stack-grafana \
  -o jsonpath='{.data.admin-user}' | base64 -d; echo

sudo kubectl -n monitoring get secret kube-prometheus-stack-grafana \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo
```

### Vault

Vault UI (로컬)

```zsh
sudo kubectl -n vault port-forward svc/vault 8200:8200
open https://127.0.0.1:8200
```

Secret 수동 갱신

```zsh
kubectl -n litomi-stg annotate externalsecret litomi-backend-secret \
  litomi.dev/reconcile-ts="$(date +%s)" --overwrite

kubectl -n litomi-stg get externalsecret litomi-backend-secret \
  -o jsonpath='{.status.refreshTime}{"\n"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}'
```

### Monitoring

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

### Ingress 라우팅

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
