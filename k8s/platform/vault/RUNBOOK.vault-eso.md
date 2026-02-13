# Vault OSS + External Secrets Operator (ESO) 운영 런북

이 문서는 **Git에는 “참조 선언(SecretStore/ExternalSecret)”만 두고**, **실제 시크릿 값은 Vault에만 저장**하는 운영 방식을 기준으로 해요.  
또한 `ExternalSecret`이 삭제되면 생성된 Kubernetes `Secret`도 같이 정리되도록(`creationPolicy: Owner`, `deletionPolicy: Delete`) 구성돼 있어요.

## 0) 전제

- **SOPS는 사용하지 않아요.**
- Vault ↔ Kubernetes 인증은 **Vault `kubernetes` auth method**를 써요.
- 권한 경계는 **네임스페이스/환경 단위**로 쪼개요.
- Vault Policy는 **read 위주**로 두고, 불필요한 `list`는 최소화해요.
- “처음 1번”만 사람이 부트스트랩하고, 이후에는 GitOps로 흘러가게 해요.

## 1) k3s Secret 암호화(at-rest) 켜기

ESO가 만든 Kubernetes `Secret`도 결국 k3s 데이터스토어(etcd/sqlite)에 저장돼요. 그래서 **k3s secret encryption을 반드시 켜는 걸 권장해요.**

> k3s 설정 파일이 이미 있으면 거기에 합쳐 주세요.

```zsh
sudo mkdir -p /etc/rancher/k3s
sudo tee /etc/rancher/k3s/config.yaml >/dev/null <<'YAML'
secrets-encryption: true
YAML

sudo systemctl restart k3s
```

```zsh
# 상태 확인
sudo k3s secrets-encrypt status || true
```

## 2) (GitOps) Vault / ESO 설치 확인

이 레포는 Argo CD app-of-apps로 다음 애드온을 설치해요.

- `platform-vault` (namespace: `vault`)
- `platform-external-secrets` (namespace: `external-secrets`)

Argo CD에서 앱이 Sync 됐는지 확인해 주세요.

## 3) Vault TLS 준비

### 3-1) 인증서/키 생성 (예시: self-signed)

운영 환경에서는 조직/플랫폼 표준 CA를 쓰는 걸 추천해요. 여기서는 예시로 self-signed를 들어요.

```zsh
mkdir -p /tmp/vault-tls && cd /tmp/vault-tls

# CA
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -subj "/CN=litomi-vault-ca" \
  -keyout ca.key -out ca.crt

# Server cert (Vault Service DNS에 맞춰 SAN을 넣어요)
cat >server.cnf <<'EOF'
[req]
distinguished_name = dn
req_extensions = req_ext
prompt = no

[dn]
CN = vault.vault.svc

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = vault.vault.svc
DNS.2 = vault.vault.svc.cluster.local
EOF

openssl req -new -newkey rsa:4096 -nodes -sha256 \
  -keyout tls.key -out tls.csr -config server.cnf

openssl x509 -req -sha256 -days 825 \
  -in tls.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out tls.crt -extensions req_ext -extfile server.cnf
```

### 3-2) Vault namespace에 TLS Secret 생성

```zsh
sudo kubectl -n vault create secret generic vault-tls \
  --from-file=tls.crt=/tmp/vault-tls/tls.crt \
  --from-file=tls.key=/tmp/vault-tls/tls.key \
  --from-file=ca.crt=/tmp/vault-tls/ca.crt \
  --dry-run=client -o yaml | sudo kubectl apply -f -

sudo kubectl -n vault get secret vault-tls
```

## 4) 각 네임스페이스에 Vault CA 배포

`SecretStore.spec.provider.vault.caProvider`는 `vault-ca` ConfigMap을 참조해요. (키: `ca.crt`)

적용 대상(현재 레포 기준):

- `litomi-prod`
- `litomi-stg`
- `cloudflared`
- `monitoring`
- `velero`
- `minio`

```zsh
for ns in litomi-prod litomi-stg cloudflared monitoring velero minio; do
  sudo kubectl -n "$ns" create configmap vault-ca \
    --from-file=ca.crt=/tmp/vault-tls/ca.crt \
    --dry-run=client -o yaml | sudo kubectl apply -f -
done
```

## 5) Vault init / unseal / 기본 엔진 설정

네트워크 정책 때문에 `port-forward`가 막힐 수 있기 때문에 Vault Pod(예: `vault-0`) 안에서 작업하는 걸 권장해요.

```zsh
sudo kubectl -n vault wait --for=jsonpath='{.status.phase}'=Running pod/vault-0 --timeout=180s

sudo kubectl -n vault exec -it vault-0 -- sh
```

`vault-0` Pod 안에서:

```zsh
export VAULT_ADDR="https://vault.vault.svc:8200"
export VAULT_CACERT="/vault/userconfig/vault-tls/ca.crt"

# init (출력되는 unseal key / root token은 안전한 곳에 보관해 주세요)
vault operator init

# unseal (threshold만큼 반복)
vault operator unseal

# admin 작업을 위해 로그인해요
vault login
```

KV(v2) 엔진을 `kv/`로 켜요:

```zsh
vault secrets enable -path=kv kv-v2
```

Vault audit(권장):

```zsh
# auditStorage(PVC)가 /vault/audit 로 마운트돼요. 필요하면 정책에 맞게 경로를 바꿔요.
vault audit enable file file_path=/vault/audit/audit.log
```

## 6) Vault Kubernetes auth method 설정

```zsh
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc:443" \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token
```

## 7) 네임스페이스/환경 단위 Policy + Role 만들기

### 7-1) Policy (read 위주)

예시(네임스페이스 단위로 경로를 분리해요):

```zsh
vault policy write litomi-prod-read - <<'HCL'
path "kv/data/litomi-prod/*" {
  capabilities = ["read"]
}
HCL

vault policy write litomi-stg-read - <<'HCL'
path "kv/data/litomi-stg/*" {
  capabilities = ["read"]
}
HCL

vault policy write cloudflared-read - <<'HCL'
path "kv/data/cloudflared/*" {
  capabilities = ["read"]
}
HCL

vault policy write monitoring-read - <<'HCL'
path "kv/data/monitoring/*" {
  capabilities = ["read"]
}
HCL

vault policy write velero-read - <<'HCL'
path "kv/data/velero/*" {
  capabilities = ["read"]
}
HCL

vault policy write minio-read - <<'HCL'
path "kv/data/minio/*" {
  capabilities = ["read"]
}
HCL
```

### 7-2) Role (ServiceAccount + Namespace 바인딩)

각 네임스페이스에 `eso-vault` ServiceAccount가 있어요(매니페스트로 생성돼요).

```zsh
vault write auth/kubernetes/role/eso-litomi-prod \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=litomi-prod \
  policies=litomi-prod-read \
  audience=vault \
  ttl=1h

vault write auth/kubernetes/role/eso-litomi-stg \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=litomi-stg \
  policies=litomi-stg-read \
  audience=vault \
  ttl=1h

vault write auth/kubernetes/role/eso-cloudflared \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=cloudflared \
  policies=cloudflared-read \
  audience=vault \
  ttl=1h

vault write auth/kubernetes/role/eso-monitoring \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=monitoring \
  policies=monitoring-read \
  audience=vault \
  ttl=1h

vault write auth/kubernetes/role/eso-velero \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=velero \
  policies=velero-read \
  audience=vault \
  ttl=1h

vault write auth/kubernetes/role/eso-minio \
  bound_service_account_names=eso-vault \
  bound_service_account_namespaces=minio \
  policies=minio-read \
  audience=vault \
  ttl=1h
```

## 8) Vault에 시크릿 값 넣기

로컬에서는 예전처럼 `.env` 파일로 값을 정리해두고(예: `k8s/apps/litomi/secrets/backend-secret.prod.env`), 그 값을 Vault로 옮겨도 돼요.

```zsh
# file-like secrets
#
# 1) (k3s Ubuntu 머신에서) 파일 준비
# vi /tmp/aiven.crt
# vi /tmp/ga-key.pem
# vi /tmp/supabase.crt
#
# 2) (k3s Ubuntu 머신에서) Vault Pod로 파일 복사
sudo kubectl -n vault exec -i vault-0 -- sh -c 'cat > /tmp/aiven.crt' < /tmp/aiven.crt
sudo kubectl -n vault exec -i vault-0 -- sh -c 'cat > /tmp/ga-key.pem' < /tmp/ga-key.pem
sudo kubectl -n vault exec -i vault-0 -- sh -c 'cat > /tmp/supabase.crt' < /tmp/supabase.crt

# 3) litomi-prod file-like secrets
vault kv put kv/litomi-prod/litomi-backend-file \
  AIVEN_CERTIFICATE=@/tmp/aiven.crt \
  GA_SERVICE_ACCOUNT_KEY=@/tmp/ga-key.pem \
  SUPABASE_CERTIFICATE=@/tmp/supabase.crt

# 3) litomi-stg file-like secrets
vault kv put kv/litomi-stg/litomi-backend-file \
  AIVEN_CERTIFICATE=@/tmp/aiven.crt \
  GA_SERVICE_ACCOUNT_KEY=@/tmp/ga-key.pem \
  SUPABASE_CERTIFICATE=@/tmp/supabase.crt

# litomi-prod secrets
vault kv put kv/litomi-prod/litomi-backend-secret \
  ADSTERRA_API_KEY="..." \
  POSTGRES_URL="postgresql://..." \
  JWT_SECRET_ACCESS_TOKEN="..." \
  JWT_SECRET_REFRESH_TOKEN="..." \
  JWT_SECRET_TRUSTED_DEVICE="..." \
  JWT_SECRET_BBATON_ATTEMPT="..."

# litomi-stg secrets
vault kv put kv/litomi-stg/litomi-backend-secret \
  ADSTERRA_API_KEY="..." \
  POSTGRES_URL="postgresql://..." \
  JWT_SECRET_ACCESS_TOKEN="..." \
  JWT_SECRET_REFRESH_TOKEN="..." \
  JWT_SECRET_TRUSTED_DEVICE="..." \
  JWT_SECRET_BBATON_ATTEMPT="..."

# platform secrets
vault kv put kv/cloudflared/cloudflared-token token="eyJh..."
vault kv put kv/monitoring/grafana-admin admin-user="..." admin-password="..."
vault kv put kv/monitoring/alertmanager-discord-webhook-warning url="https://discord.com/api/webhooks/..."
vault kv put kv/monitoring/alertmanager-discord-webhook-critical url="https://discord.com/api/webhooks/..."

# velero (S3/R2 credentials file)
cat > /tmp/credentials-velero <<'EOF'
[default]
aws_access_key_id=...
aws_secret_access_key=...
EOF
vault kv put kv/velero/velero-cloud-credentials cloud=@/tmp/credentials-velero

# minio root credentials (for in-cluster S3)
vault kv put kv/minio/minio-root root-user="..." root-password="..."
```

작업이 끝나면 `/tmp/*.crt`, `/tmp/*.pem` 같은 **임시 파일은 지우는 걸 권장해요.** (남겨놔도 동작은 하지만, 노출 면적이 커져요)

- **k3s(Ubuntu) 머신**:

```zsh
sudo rm -f /tmp/aiven.crt /tmp/ga-key.pem /tmp/supabase.crt
```

- **Vault Pod**:

```zsh
sudo kubectl -n vault exec vault-0 -- rm -f /tmp/aiven.crt /tmp/ga-key.pem /tmp/supabase.crt
```

## 9) 동작 확인

ESO가 ExternalSecret을 보고 Kubernetes Secret을 생성해요.

```zsh
sudo kubectl -n litomi-prod get secretstore,externalsecret
sudo kubectl -n litomi-prod get secret litomi-backend-secret litomi-backend-file

sudo kubectl -n litomi-stg get secretstore,externalsecret
sudo kubectl -n litomi-stg get secret litomi-backend-secret litomi-backend-file

sudo kubectl -n cloudflared get externalsecret cloudflared-token
sudo kubectl -n cloudflared get secret cloudflared-token

sudo kubectl -n monitoring get externalsecret grafana-admin
sudo kubectl -n monitoring get secret grafana-admin

# `SecretDeleted`로 나오면(=생성될 Secret이 없는 상태),
# - Vault에 해당 key/value가 실제로 들어있는지 확인하고
# - refreshInterval(기본 1h) 때문에 아직 반영 전일 수 있으니 한 번 reconcile을 트리거해요.
#
# sudo kubectl -n litomi-prod annotate externalsecret litomi-backend-secret force-sync="$(date +%s)" --overwrite
# sudo kubectl -n litomi-stg annotate externalsecret litomi-backend-secret force-sync="$(date +%s)" --overwrite
```

## 디버깅

### 로컬에서 port-forward로 Vault health/UI 확인하기

Vault는 TLS(HTTPS)로 떠 있어요. 그래서 `http://127.0.0.1:8200`로 접근하면 `connection reset by peer`처럼 끊길 수 있어요.

```zsh
# 1) 포트 포워딩
sudo kubectl -n vault port-forward svc/vault 8200:8200
```

접속

```
https://127.0.0.1:8200/ui/
```
