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
curl -sfL https://get.k3s.io | sudo sh -s - server --cluster-init --secrets-encryption

# (대기)
sudo kubectl wait --for=condition=Ready node --all --timeout=180s
sudo kubectl -n kube-system wait --for=condition=Available deployment --all --timeout=180s

# (확인)
sudo kubectl get nodes -o wide
sudo kubectl get --raw='/readyz?verbose'
sudo timeout 60s sh -c 'until k3s secrets-encrypt status >/dev/null 2>&1; do sleep 2; done'
sudo k3s secrets-encrypt status
sudo k3s etcd-snapshot save --name bootstrap-$(date +%Y%m%d-%H%M%S)
sudo k3s etcd-snapshot ls
```

### 3) Argo CD 설치

CRD 크기 때문에 **server-side apply**를 권장해요.

```zsh
sudo kubectl apply --server-side --force-conflicts -k k8s/bootstrap/argocd

# (대기)
sudo kubectl -n argocd wait --for=condition=Available deployment --all --timeout=300s
sudo kubectl -n argocd rollout status statefulset/argocd-application-controller --timeout=300s
sudo kubectl -n argocd wait --for=create secret/argocd-initial-admin-secret --timeout=180s

# (확인)
sudo kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d; echo
```

### 4) GitOps 시작 (root app-of-apps 적용)

```zsh
sudo kubectl apply -f k8s/bootstrap/root/root.yaml

# (대기)
sudo kubectl -n argocd wait --for=jsonpath='{.status.sync.status}'=Synced applications.argoproj.io/root --timeout=300s
sudo kubectl -n argocd wait --for=jsonpath='{.status.health.status}'=Healthy applications.argoproj.io/root --timeout=300s

# (확인)
sudo kubectl -n argocd get applications.argoproj.io
```

### 5) Vault + External Secrets(ESO) 준비

이 클러스터는 Vault를 SSOT로 두고 ESO가 Kubernetes Secret을 만들어요.

- **1회 수동 작업 런북**: `k8s/platform/vault/RUNBOOK.vault-eso.md`
- **실행 시점**: 4번(root app-of-apps 적용) 이후에 진행해 주세요. 먼저 `vault` 네임스페이스가 생겼는지 확인해요.
- **(필수) k3s Secret 암호화(at-rest)**: k3s 설치할 때 `--secrets-encryption`을 켜는 걸 권장해요. (이미 설치했다면 RUNBOOK 1번을 따라 켜 주세요.)

### 6) 접속 확인

- **stg web**: `https://stg.litomi.in`
- **stg api**: `https://api-stg.litomi.in/health`
- **prod web**: `https://litomi.in`
- **prod api**: `https://api.litomi.in/health`
- **Argo CD**: `https://argocd.litomi.in`
- **Grafana**: `https://grafana.litomi.in`

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
- [Velero(공식)](https://velero.io/docs/)

### 런북

- 백업/DR: `k8s/platform/velero/RUNBOOK.backup-dr.md`

## 프로덕션 모범 사례(요약)

로컬 k3s(단일 노드)는 “프로덕션과 최대한 비슷하게” 연습하기엔 좋아요. 다만 프로덕션은 장애/보안/업그레이드가 핵심이라서, 아래 원칙을 같이 챙기는 걸 권장해요.

- **Git을 단일 진실(SSoT)로 두기**: 클러스터에서 `kubectl edit`로 고치기보단, Git에 반영해서 Argo CD가 맞추게 해요.
- **버전 핀(pin)하기**: Helm chart / 이미지 태그는 `latest` 대신 버전 고정(지금처럼 `targetRevision` 고정)해요.
- **AppProject로 경계 만들기**: 팀/플랫폼/앱별로 `destinations`, `sourceRepos`, (필요하면) `clusterResourceWhitelist`를 제한해요.
- **Auto-sync는 “의도된 drift만” 허용하기**: Grafana admin Secret/`checksum/secret`, webhook `caBundle`처럼 비교 시점마다 달라질 수 있는 필드는 `ignoreDifferences`로 명시해서, 불필요한 self-heal 루프를 막아요.
- **CRD는 업그레이드 절차를 분리하기**: CRD 변경은 영향이 커서(특히 모니터링 스택) 업그레이드 전에 릴리즈 노트/호환성 확인을 습관화해요.
- **Secret은 Git에 넣지 않기**: External Secrets / SOPS 등으로 “Git에 암호화해서” 관리하거나, 최소한 런타임 주입으로 관리해요.
- **Argo CD 자체도 모니터링하기**: Argo CD 리소스 사용량/에러/Sync 실패 알림을 꼭 걸어둬요.

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

### Grafana 접속/비밀번호 확인

```zsh
# Grafana UI (로컬)
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
open http://127.0.0.1:3000
```

```zsh
# admin 계정/비밀번호 확인
sudo kubectl -n monitoring get secret kube-prometheus-stack-grafana \
  -o jsonpath='{.data.admin-user}' | base64 -d; echo

sudo kubectl -n monitoring get secret kube-prometheus-stack-grafana \
  -o jsonpath='{.data.admin-password}' | base64 -d; echo
```
