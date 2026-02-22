# k3s 재부팅 후 점검 런북

이 문서는 **k3s 마스터 노드(OrbStack VM) 재부팅 직후** 전체 플랫폼 상태 점검/재동기화를 고정하기 위한 런북이에요. 아래는 Ubuntu 내부에서 직접 실행하는 절차예요.

## 1) 실행 스크립트

파일:

- `k8s/platform-ops.sh` (단일 실행 스크립트)

기본 실행(권장):

```zsh
cd /Users/gwak2837/Documents/GitHub/litomi
./k8s/platform-ops.sh --reboot-mode
```

점검만(무변경):

```zsh
./k8s/platform-ops.sh --reboot-mode --check-only
```

공개 URL 체크 제외:

```zsh
./k8s/platform-ops.sh --reboot-mode --skip-public-check
```

## 2) 스크립트가 수행하는 항목

1. Kubernetes API Ready 대기
2. Node Ready 대기
3. 핵심 워크로드 준비 확인
   - `kube-system/coredns`
   - `kube-system/traefik`
   - `argocd/argocd-repo-server`
   - `argocd/argocd-application-controller`
   - `external-secrets/external-secrets`
   - `vault/vault-0`
4. Vault sealed 여부 확인
5. 재동기화 액션 실행(기본 모드)
   - 모든 `SecretStore` reconcile 트리거
   - 모든 `ExternalSecret` reconcile 트리거
   - 모든 Argo CD Application hard refresh
6. 최종 상태 검증
   - `SecretStore` Ready=True
   - `ExternalSecret` Ready=True
   - Argo CD apps Synced/Healthy
   - Velero 상태(BackupStorageLocation/Schedule/Backup)
   - Observability 상태(blackbox/Loki/Fluent Bit/Tempo/OTel)
   - 공개 URL 응답(기본: `https://argocd.litomi.in/`, `https://litomi.in`, `https://api.litomi.in/health`)

## 3) Vault sealed일 때

스크립트는 sealed 여부를 감지하면 실패로 종료하고, 아래 수동 절차를 안내해요.

```zsh
sudo kubectl -n vault exec -it vault-0 -- sh
```

이후 `vault-0` pod 내부에서

```zsh
export VAULT_ADDR="https://vault.vault.svc:8200"
export VAULT_CACERT="/vault/userconfig/vault-tls/ca.crt"
vault operator unseal <UNSEAL_KEY_1>
vault operator unseal <UNSEAL_KEY_2>
vault operator unseal <UNSEAL_KEY_3>
```

unseal 완료 후 스크립트를 다시 실행하세요.

## 4) systemd 자동 실행 등록

### 4-1) 설치 + enable

Ubuntu 터미널에서 실행:

```zsh
cd /home/gwak2837/litomi
./k8s/platform-ops.sh --install-reboot-service
```

기본값 변경이 필요하면 설치 전에 환경변수를 지정할 수 있어요.

```zsh
SERVICE_KUBECTL_CMD=kubectl \
SERVICE_BOOT_WAIT_SECONDS=900 \
SERVICE_CHECK_INTERVAL_SECONDS=5 \
SERVICE_TIMEOUT_START_SEC=1800 \
./k8s/platform-ops.sh --install-reboot-service
```

### 4-2) 시작/상태 확인

```zsh
./k8s/platform-ops.sh --show-reboot-service-status
```

로그 확인:

```zsh
./k8s/platform-ops.sh --show-reboot-service-logs
# 최근 500줄:
./k8s/platform-ops.sh --show-reboot-service-logs --reboot-service-log-lines 500
```

### 4-3) 해제/삭제

```zsh
./k8s/platform-ops.sh --remove-reboot-service
```
