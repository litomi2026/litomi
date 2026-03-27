# 백업/DR 런북 (k3s + Argo CD + Velero)

이 레포는 GitOps(Argo CD)라서 **리소스 정의는 Git이 백업 역할**을 해요.  
하지만 **상태(PV 데이터, k3s datastore)** 는 Git에 없어서 별도 백업/복구 절차가 필요해요.

## 자동화 빠른 시작 (`k8s/platform-ops.sh`)

```zsh
cd /Users/gwak2837/Documents/GitHub/litomi

# Velero 포함 플랫폼 상태 점검
./k8s/platform-ops.sh --skip-public-check
```

위 커맨드는 아래를 포함해 확인해요.

- Argo CD 앱 `velero` Sync/Health
- `velero` Deployment readiness
- node-agent DaemonSet readiness
- BackupStorageLocation phase(`Available`)
- Schedule/Backup 개수, Velero 로그 접근 가능 여부

## 0) 목표 정하기 (RPO/RTO)

- **RPO**: “최대 몇 시간/분 데이터 유실을 허용할지”
- **RTO**: “최대 몇 시간/분 안에 서비스 복구가 돼야 하는지”

단일 노드 k3s는 SPOF라서, 프로덕션에선 최소 3대(server)로 HA를 권장하지만(현 구조는 연습/소규모엔 좋아요), 지금 환경에서도 백업/복구 리허설만 잘 해두면 DR 체감 난이도가 크게 내려가요.

## 1) 무엇을 백업해야 하나요?

- **Git 리포지토리**: (이미 있음) Argo CD가 원하는 상태를 다시 만들어요.
- **k3s datastore(embedded etcd)**: 클러스터 오브젝트의 “실제 상태”예요.
- **PersistentVolume(PV) 데이터**: Vault/Prometheus 같은 상태ful 워크로드 데이터예요.
- **외부 DB/스토리지**: (예: Neon/Postgres, R2 등) 이건 해당 서비스의 백업 정책이 별도로 필요해요.

## 2) k3s datastore 백업 (embedded etcd)

k3s는 embedded etcd를 쓰는 구성(보통 HA/`--cluster-init`)에서 **스냅샷**을 지원해요.  
(자세한 내용은 k3s 문서를 따라가 주세요.)

- **스냅샷 파일 저장 위치(로컬)**는 기본적으로 노드 디스크라서, 프로덕션이면 **오프노드(오브젝트 스토리지)** 로 복제하는 걸 권장해요.
- k3s 공식: [Datastore Backup and Restore](https://docs.k3s.io/datastore/backup-restore), [`etcd-snapshot` CLI](https://docs.k3s.io/cli/etcd-snapshot)

## 3) PV 백업(상태ful 워크로드) - Velero

이 레포는 Velero를 Argo CD로 설치하도록 구성돼 있어요.

- **오브젝트 스토리지**: 클러스터 안의 MinIO(S3 호환)를 기본으로 써요. (VM이 날아가면 백업도 같이 없어져도 되는 케이스에 적합해요)
- **Argo CD Application**: `k8s/argocd/applications/velero.yaml`
- **Helm values**: `k8s/platform/velero/velero.values.yaml`
- **자격증명(Secret)**: Vault + ESO로 `velero-cloud-credentials`를 생성해요.

## 4) 백업이 잘 도는지 확인

Velero CLI를 쓰면 제일 편하지만, Kubernetes 리소스로도 확인할 수 있어요.

```zsh
sudo kubectl -n velero get backupstoragelocation
sudo kubectl -n velero get schedule
sudo kubectl -n velero get backup
sudo kubectl -n velero logs deploy/velero --tail=200
```

## 5) 복구(DR) 리허설 시나리오(권장)

### 시나리오 A) “새 클러스터 + Velero restore” 방식

1. 새 k3s 클러스터 준비
2. Velero를 동일 bucket 설정으로 설치
3. `velero restore`로 복구
4. Argo CD를 부트스트랩하고 GitOps로 원하는 상태를 재동기화

GitOps(Argo CD)가 이미 있으니, 프로덕션에선 “백업으로 복구 → GitOps로 재정렬” 흐름을 자주 써요.

### 시나리오 B) “GitOps로 재배포 + 데이터만 복구” 방식

이 방식은 더 깔끔하지만(드리프트 최소화), 데이터만 선택 복구하는 설계/검증이 필요해서 운영 난이도가 올라가요.  
처음엔 시나리오 A로 리허설 루프를 돌리고, 익숙해지면 B로 발전시키는 걸 추천해요.

## 참고(공식)

- [Kubernetes 프로덕션 환경 고려사항](https://kubernetes.io/ko/docs/setup/production-environment/)
- [k3s Datastore Backup and Restore](https://docs.k3s.io/datastore/backup-restore)
- [k3s `etcd-snapshot` CLI](https://docs.k3s.io/cli/etcd-snapshot)
- [Velero 공식 문서](https://velero.io/docs/)
- [Argo CD Declarative Setup](https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/)
