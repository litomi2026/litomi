# infra/gcp — proxy Cloud Run 배포 부트스트랩

`apps/proxy`(소스 프록시)를 GCP Cloud Run에 자동 배포하기 위한 IAM/WIF 부트스트랩이다.

파이프라인:

```
GitHub Actions(main push)
  └─ build-and-publish-proxy-image  → ghcr.io/litomi2026/litomi-proxy@<digest> (GitHub Packages, linux/amd64)
  └─ deploy-proxy-cloud-run         → WIF 인증 → digest 핀 → gcloud run services replace
Cloud Run(litomi-proxy)             → GHCR에서 이미지 pull(공개 패키지)
```

이 Terraform이 관리하는 것은 **부트스트랩뿐**이다: 배포용 서비스 계정, 프로젝트 IAM,
GitHub OIDC용 Workload Identity Federation. Cloud Run 서비스와 이미지 배포는 CI가 담당한다
(서비스 정의는 [`apps/proxy/cloudrun/service.yaml`](../../apps/proxy/cloudrun/service.yaml)).

> ⚠️ 이 프록시의 존재 이유는 **egress IP 로테이션**이다. VPC 커넥터 / Direct VPC egress /
> Cloud NAT 를 절대 붙이지 말 것 — 붙는 순간 egress가 정적 IP로 고정되어 소스에 차단된다.

## 1. Terraform apply (부트스트랩)

HCP Terraform(Terraform Cloud) 백엔드를 쓴다. organization / workspace 는 환경변수로 주입한다.

```bash
cd infra/gcp

export TF_CLOUD_ORGANIZATION="<your-hcp-org>"
export TF_WORKSPACE="litomi-proxy-gcp"        # 없으면 자동 생성됨

terraform init
terraform plan     # 기본값(project litomi-2026 / asia-northeast3 / litomi2026/litomi)이 맞는지 확인
terraform apply
```

apply 하는 주체(사용자/SA)는 대상 프로젝트에서 서비스 계정·IAM·WIF·API를 만들 수 있어야 한다
(`roles/owner` 또는 그에 준하는 권한).

기본값을 바꾸려면 `terraform.tfvars.example` 참고.

## 2. GitHub repo variables 설정

apply 후 출력된 3개 값을 이 저장소(`litomi2026/litomi`)의 **Repository variables**로 등록한다
(Secrets 아님 — 민감정보 아님). 셋 다 채워지기 전까지 `deploy-proxy-cloud-run` 잡은 자동으로 건너뛴다.

```bash
terraform output -raw workload_identity_provider   # → GCP_WORKLOAD_IDENTITY_PROVIDER
terraform output -raw deploy_service_account       # → GCP_DEPLOY_SERVICE_ACCOUNT
terraform output -raw project_id                   # → GCP_PROJECT_ID
```

gh CLI로 한 번에:

```bash
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo litomi2026/litomi \
  --body "$(terraform output -raw workload_identity_provider)"
gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo litomi2026/litomi \
  --body "$(terraform output -raw deploy_service_account)"
gh variable set GCP_PROJECT_ID --repo litomi2026/litomi \
  --body "$(terraform output -raw project_id)"
```

## 3. GHCR 패키지 공개 설정 (out-of-band, 1회)

Cloud Run은 3rd-party 비공개 레지스트리 네이티브 인증이 없다(OKE의 `imagePullSecret` 같은 게 없음).
따라서 `ghcr.io/litomi2026/litomi-proxy` 패키지를 **Public**으로 두어야 Cloud Run이 직접 pull 한다.

- 첫 이미지 push 후 GitHub → Packages → `litomi-proxy` → Package settings → Change visibility → **Public**.
- 비공개로 유지하려면 대안은 Artifact Registry remote repo(GHCR 프록시)를 두고 그 경로로 배포하는 것.

## 4. 동작 확인

`main`에 push 하면 워크플로가 이미지를 빌드/푸시하고 Cloud Run에 배포한다. 수동 확인:

```bash
gcloud run services describe litomi-proxy --project litomi-2026 --region asia-northeast3
curl -i "$(gcloud run services describe litomi-proxy --project litomi-2026 --region asia-northeast3 --format='value(status.url)')/health"
# 204 기대
```

## 하드닝 옵션

- **공개 호출(allUsers invoker)**: 기본은 공개다(현 Vercel과 동일한 노출 수준, Cloudflare가 앞단).
  조직 정책 `iam.allowedPolicyMemberDomains`(Domain Restricted Sharing)가 `allUsers`를 막으면
  워크플로의 "Allow public invocations" 단계가 실패한다. 그 경우 해당 정책에 예외를 두거나,
  Cloud Run ingress를 `internal-and-cloud-load-balancing`으로 바꾸고 CF ↔ Cloud Run 사이에
  인증 토큰을 붙이는 방식으로 전환한다.
- **repo/ref 제한**: WIF provider의 `attribute_condition`은 저장소 단위로 제한한다.
  브랜치까지 좁히려면 `assertion.ref == "refs/heads/main"` 조건을 추가한다.
- **최소 권한**: 배포 SA는 `roles/run.admin` + `roles/iam.serviceAccountUser`만 가진다.
