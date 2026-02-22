# k3s 재부팅 후 점검 런북

이 문서는 **k3s 마스터 노드 재부팅 직후** 플랫폼을 빠르게 복구/검증하는 절차예요.

## 1) 수동 점검 실행

```zsh
cd /Users/gwak2837/Documents/GitHub/litomi

# 재부팅 점검/재동기화
./k8s/platform-ops.sh --mode reboot

# 공개 URL 체크 제외
./k8s/platform-ops.sh --mode reboot --skip-public-check
```

## 2) reboot 모드가 수행하는 항목

1. Kubernetes API/Node Ready 확인
2. Argo CD 컨트롤 플레인 준비 확인
3. Vault Pod 실행 상태 확인 + 필요 시 자동 unseal
4. SecretStore/ExternalSecret/Argo CD reconcile 트리거
5. 최종 상태 검증
   - Argo CD apps Synced/Healthy
   - Vault SecretStore Ready=True
   - 필수 Kubernetes Secret 존재
   - Vault initialized/unsealed
   - (옵션) 공개 URL 응답

## 3) Vault unseal 실패 시

`platform-ops.sh`는 기본적으로 `VAULT_INIT_OUTPUT`(기본값: `~/vault-tls/vault-init.json`)에서
unseal key를 읽어요. 파일이 없거나 키가 맞지 않으면 실패해요.

먼저 init 파일 경로를 확인하고 다시 실행하세요:

```zsh
echo "$VAULT_INIT_OUTPUT"
./k8s/platform-ops.sh --mode reboot --skip-public-check
```

필요하면 수동 unseal:

```zsh
sudo kubectl -n vault exec -it vault-0 -- sh
```

```zsh
export VAULT_ADDR="https://vault.vault.svc:8200"
export VAULT_CACERT="/vault/userconfig/vault-tls/ca.crt"
vault operator unseal <UNSEAL_KEY_1>
vault operator unseal <UNSEAL_KEY_2>
vault operator unseal <UNSEAL_KEY_3>
```

## 4) systemd 자동 실행

`init` 모드(`./k8s/platform-ops.sh`)를 실행하면
`litomi-platform-reboot.service`를 자동 설치/활성화해요.

상태/로그 확인:

```zsh
sudo systemctl status litomi-platform-reboot.service --no-pager
sudo journalctl -u litomi-platform-reboot.service -n 200 --no-pager
```

서비스 재설치(유닛 재생성)는 init 모드를 다시 실행하면 돼요.

해제가 필요하면:

```zsh
sudo systemctl disable --now litomi-platform-reboot.service
sudo rm -f /etc/systemd/system/litomi-platform-reboot.service
sudo systemctl daemon-reload
```
