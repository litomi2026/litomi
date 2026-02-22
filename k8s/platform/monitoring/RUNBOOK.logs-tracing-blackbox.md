## 4단계 관측 확장 (로그/트레이싱/블랙박스)

Prometheus/Grafana/Alertmanager 다음 단계로, 로그/트레이싱/외부 사용자 관점 모니터링을 붙이는 운영 가이드예요.

### 자동화 빠른 시작 (`k8s/platform-ops.sh`)

```zsh
cd /Users/gwak2837/Documents/GitHub/litomi

# 재부팅 점검 프로필(무변경)로 Monitoring/Logging/Tracing 포함 상태 점검
./k8s/platform-ops.sh --reboot-mode --check-only --skip-public-check
```

위 커맨드는 아래를 포함해 확인해요.

- Argo CD 앱 상태 (`platform-monitoring`, `platform-logging-*`, `platform-tracing-*`)
- `monitoring/blackbox-exporter` Deployment readiness
- `Probe`/`PrometheusRule` 리소스 존재
- `monitoring/logging/tracing`의 SecretStore/ExternalSecret Ready 상태
- Loki/Fluent Bit/Tempo/OpenTelemetry Collector 워크로드 준비 상태

### 이 레포에서 이미 적용된 것

- `Loki` (`platform-logging-loki`)
- `Fluent Bit` (`platform-logging-fluent-bit`)
- `Tempo` (`platform-tracing-tempo`)
- `OpenTelemetry Collector` (`platform-tracing-otel-collector`)
- Grafana datasource provisioning
  - `Loki` (`uid: loki`)
  - `Tempo` (`uid: tempo`, `tracesToLogsV2` 설정)
- `blackbox exporter` Deployment/Service
- Prometheus Operator `Probe`로 외부 엔드포인트 검사
  - `https://litomi.in`
  - `https://api.litomi.in/health`
- 관측 파이프라인 기본 알림룰
  - `LokiTargetsMissing`
  - `FluentBitTargetsMissing`
  - `TempoTargetsMissing`
  - `OTelCollectorTargetsMissing`
  - `OTelCollectorSpanExportFailures`

### 프로덕션 권장 아키텍처 (k3s + Argo CD)

1. **Logs**
   - `Fluent Bit`(또는 `Grafana Alloy`)를 DaemonSet으로 깔아서 노드/컨테이너 로그를 수집해요.
   - 백엔드는 `Loki`를 써요.
   - 앱 로그에는 `trace_id`, `span_id`를 포함해서 로그-트레이스 상관 분석이 가능하게 해요.

2. **Traces**
   - 앱은 `OTLP`로 `OpenTelemetry Collector`에 전송해요.
   - Collector는 gateway(Deployment) 패턴을 기본으로 두고, 필요할 때만 agent(DaemonSet)를 추가해요.
   - 트레이스 백엔드는 `Tempo`(또는 `Jaeger`)를 써요.

### 앱 OTLP 기본값 (이 레포)

- `litomi-common-env`에 아래 기본값을 넣어 stg/prod에 공통 적용해요.
  - `OTEL_EXPORTER_OTLP_ENDPOINT=http://opentelemetry-collector.tracing.svc:4318`
  - `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`
  - `OTEL_TRACES_SAMPLER=parentbased_traceidratio`
  - `OTEL_TRACES_SAMPLER_ARG=0.1`
  - `OTEL_PROPAGATORS=tracecontext,baggage`

3. **Blackbox**
   - `Probe` CR로 외부 URL을 주기적으로 체크해요.
   - 이 방식은 인그레스/터널/외부 DNS를 포함한 "사용자 관점" 가용성을 확인하기 좋아요.

### OrbStack + 단일노드 k3s 운영 팁

- 단일 노드에서는 디스크 압박이 장애로 바로 이어지기 쉬워요.
  - Loki/Tempo는 가능하면 오브젝트 스토리지(MinIO/S3)에 저장해요.
  - 보존 기간(retention)을 짧게 시작하고, 실제 사용량을 본 뒤 늘려요.
- Collector/Loki/Tempo 모두 requests/limits를 먼저 보수적으로 잡고 시작해요.
- GitOps 기준으로 Helm chart 버전을 핀하고, 업그레이드 전에 릴리즈 노트를 확인해요.

### GitOps 적용 순서 권장

1. `blackbox exporter + Probe` (완료)
2. `Loki` + 로그 수집기(Fluent Bit 또는 Alloy) (완료)
3. `Tempo` + `OpenTelemetry Collector` (완료)
4. Grafana 데이터소스/대시보드/알림 룰 정리

### 최소 검증 커맨드

```zsh
# blackbox / logs / tracing 리소스
sudo kubectl -n monitoring get deploy,svc,pod | grep blackbox
sudo kubectl -n monitoring get probe
sudo kubectl -n monitoring get prometheusrule observability-pipeline
sudo kubectl -n logging get deploy,ds,svc,pod
sudo kubectl -n tracing get sts,deploy,svc,pod

# Prometheus 타겟 확인
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
open http://127.0.0.1:9090/targets

# Grafana에서 데이터소스 확인
sudo kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
open http://127.0.0.1:3000/connections/datasources
```

Prometheus UI에서 아래 쿼리로 상태를 빠르게 볼 수 있어요.

```promql
# Blackbox
probe_success

# Fluent Bit
fluentbit_output_proc_records_total

# Tempo
tempo_distributor_spans_received_total

# OTel Collector
otelcol_exporter_sent_spans
```

실제 트레이스 유입은 Tempo에서 바로 확인할 수 있어요.

```zsh
sudo kubectl -n tracing port-forward svc/tempo 3200:3200
curl -s "http://127.0.0.1:3200/metrics" | grep -E "tempo_distributor_spans_received_total|tempo_receiver_accepted_spans"
```

### 공식 문서

- Kubernetes 프로덕션 체크리스트: https://kubernetes.io/docs/setup/production-environment/
- Prometheus Operator API (`Probe`): https://prometheus-operator.dev/docs/api-reference/api/
- Blackbox exporter 가이드: https://prometheus.io/docs/guides/multi-target-exporter/
- OpenTelemetry Collector: https://opentelemetry.io/docs/collector/
- OpenTelemetry on Kubernetes: https://opentelemetry.io/docs/platforms/kubernetes/
- Grafana Loki: https://grafana.com/docs/loki/latest/
- Grafana Tempo: https://grafana.com/docs/tempo/latest/
