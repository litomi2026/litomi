# Vault OSS + External Secrets Operator (ESO) 운영 런북

이 문서는 **Git에는 “참조 선언(SecretStore/ExternalSecret)”만 두고**, **실제 시크릿 값은 Vault에만 저장**하는 운영 방식을 기준으로 해요.  
또한 `ExternalSecret`이 삭제되면 생성된 Kubernetes `Secret`도 같이 정리되도록(`creationPolicy: Owner`, `deletionPolicy: Delete`) 구성돼 있어요.

## 0) 자동화 빠른 시작 (`k8s/platform-ops.sh`)

```zsh
cd litomi

./k8s/platform-ops.sh
```

기본 `vault-secrets-dir`는 `./k8s/vault-secrets`이고, 필요하면 경로를 바꿀 수 있어요.

```zsh
./k8s/platform-ops.sh --vault-secrets-dir /path/to/vault-secrets
```

`--vault-secrets-dir`는 `.env` 파일을 경로 기반으로 Vault KV에 올려요.

```zsh
# 예: /path/to/vault-secrets/litomi-prod/litomi-backend-secret.env
#   -> kv/litomi-prod/litomi-backend-secret 로 업로드
# 멀티라인 값은 double quote + \n escape로 넣어요.
```

운영 기본값은 `refreshInterval` 기반 주기 동기화예요. 빠른 반영이 필요한 `gtm-server`, `cloudflared`, `litomi-backend-secret`(stg/prod)는 `5m`, 나머지는 `1h`를 사용하고, Argo CD가 관리하는 `ExternalSecret`/`SecretStore`에는 런타임 annotation을 붙여 강제 reconcile 하지 않아요.

## 1) 전제

- **SOPS는 사용하지 않아요.**
- Vault ↔ Kubernetes 인증은 **Vault `kubernetes` auth method**를 써요.
- 권한 경계는 **네임스페이스/환경 단위**로 쪼개요.
- Vault Policy는 **read 위주**로 두고, 불필요한 `list`는 최소화해요.
- “처음 1번”만 사람이 부트스트랩하고, 이후에는 GitOps로 흘러가게 해요.
