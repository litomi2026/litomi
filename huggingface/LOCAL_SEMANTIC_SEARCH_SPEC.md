## 로컬 시맨틱 검색(FAISS Flat + bge-m3) 기술 명세서

목표는 “오프라인 배포물(zip)을 내려받아, 사용자 PC에서 실행하면 곧바로 줄거리 검색(top-k + 유사도 점수)이 되는 것”이에요.

- **지원 OS 우선순위**: macOS, Windows
- **성능 우선순위**: 최고(정확도/지연 모두)
- **파일 크기**: 무관(GB 단위 가능)
- **GUI**: 후순위(웹 UI를 로컬 서버로 제공)

---

## 시스템 구성(런타임)

### 구성 요소

- **로컬 앱(네이티브 실행 파일)**: 로컬 HTTP 서버 + 임베딩 추론 + FAISS 검색
- **임베딩 모델**: `BAAI/bge-m3` (dense embedding)
- **벡터 검색 인덱스**: FAISS `IndexFlatIP` (정확도 100%, 최고 성능)
- **문서 메타 저장소**: SQLite(읽기 전용) 또는 JSONL(권장: SQLite)

### 유사도 정의(필수 고정)

- **dense embedding** \(e \in \mathbb{R}^{1024}\)
- **L2 정규화**: \( \hat{e} = \frac{e}{\|e\|\_2} \)
- **score**: cosine similarity = inner product
  - \( score = \hat{q} \cdot \hat{d} \in [-1, 1] \)
- FAISS는 `IndexFlatIP`를 사용하고, 인덱스에 넣는 벡터는 **반드시 L2 정규화된 벡터**여야 해요.

---

## 권장 포트/서버 바인딩

### 바인딩

- **기본 바인딩**: `127.0.0.1` (loopback only)
- **기본 포트**: `17777`
- **포트 충돌 처리**:
  - 환경변수 `LITOMI_PORT`가 있으면 그 포트를 우선 사용
  - 없으면 17777부터 증가시키며 사용 가능한 포트를 탐색(예: 최대 17877까지)

### 보안 기본값

- 외부 접근 금지(로컬 전용)
- CORS는 기본적으로 `Origin: http://127.0.0.1:*` / `http://localhost:*`만 허용

---

## HTTP API 명세(JSON)

### 공통 응답 헤더(권장)

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store` (로컬이지만 결과가 사용자 입력에 종속적이라 기본 no-store 권장)

### 에러 포맷(권장: problem+json 스타일)

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "query is required",
  "instance": "/api/search"
}
```

---

## 엔드포인트 목록

### 1) Health check

- **GET** `/healthz`
- **200**:

```json
{
  "ok": true,
  "version": "0.1.0",
  "model": { "id": "BAAI/bge-m3", "dims": 1024 },
  "index": { "type": "faiss.IndexFlatIP", "docs": 100000 }
}
```

---

### 2) 임베딩(dense) 단독 생성(디버그/검증용)

- **POST** `/api/embed`
- **Request**:

```json
{
  "text": "프리렌과 페른이 하렘에 갇히고...",
  "normalize": true
}
```

- **200**:

```json
{
  "dims": 1024,
  "normalized": true,
  "embedding": [0.01, -0.02, "..."]
}
```

메모:

- 실제 제품 UI에서는 보통 숨기고, 개발/검증용으로만 두는 걸 권장해요.
- `embedding`을 그대로 내보내면 크기가 커지니, 디폴트는 `includeEmbedding=false`도 가능해요.

---

### 3) 시맨틱 검색(top-k)

- **POST** `/api/search`

#### Request

```json
{
  "query": "어떤 국왕에게 프리렌과 페른 모두 뺏기고 절망하는 슈타르크가 나오는 만화",
  "topK": 10,
  "includeSnippet": true
}
```

#### Response (200)

```json
{
  "query": "어떤 국왕에게 ...",
  "topK": 10,
  "tookMs": 12,
  "hits": [
    {
      "rank": 1,
      "docId": "manga:3552762",
      "score": 0.8281909469,
      "manga": {
        "id": 3552762,
        "title": "문서에 저장된 제목",
        "source": "local"
      },
      "chunk": {
        "id": 0,
        "text": "요약/근거 텍스트 일부..."
      }
    }
  ]
}
```

#### 필드 정의

- `score`: cosine similarity(= inner product) \([-1, 1]\). **클수록 더 유사**
- `docId`: 내부 식별자(권장: `manga:{id}` 형태)
- `chunk.text`: “왜 이 결과인지” 보여주기 위한 근거 텍스트(옵션)
- `tookMs`: end-to-end(임베딩 + 검색 + 메타 조회) 소요 시간

#### 입력 검증

- `query`: trim 후 최소 2자 이상 권장
- `topK`: 1~50 권장(기본 10)

---

## 문서/데이터 파일 포맷(배포물)

### 디렉터리 예시

```
data/
  model/
    bge-m3.onnx
    tokenizer.json
    vocab.json
    merges.txt
  index/
    faiss.index
    doc_meta.sqlite
```

### doc_meta.sqlite(권장 스키마)

- 테이블: `doc`
  - `doc_id TEXT PRIMARY KEY`
  - `manga_id INTEGER`
  - `title TEXT`
  - `text TEXT` (작품당 1000자 요약 1개)

메모:

- 성능 우선이면 `text`는 풀텍스트가 아니라 “표시용”으로만 쓰고,
  검색은 오직 벡터로만 수행해요.

---

## bge-m3 임베딩 규칙(정확한 pooling + 정규화)

### Dense embedding (필수)

bge-m3의 “dense”는 **[CLS] pooling + L2 normalize**가 기본이에요.

- **Pooling**: 마지막 레이어 hidden state에서 **첫 번째 토큰([CLS]) 벡터** 사용
  - `cls = last_hidden_state[:, 0, :]`
- **Normalize**: L2 normalize
  - `emb = cls / (||cls||2 + eps)`

### 긴 문서(MCLS) 관련(선택)

bge-m3는 긴 컨텍스트(최대 8192 토큰)를 위한 “MCLS” 개념이 있지만,
“작품당 1000자 문서 1개”면 보통 **일반 CLS pooling으로 충분**해요.
성능/단순성을 위해 v1 구현에서는 **CLS pooling 고정**을 권장해요.

### 토크나이징/길이 규칙(권장)

- `max_length`:
  - **문서**: 1024(또는 2048) 권장
  - **쿼리**: 256~512 권장
- truncation: `true`
- padding: 배치가 1개면 padding 최소화(성능)

---

## ONNX export 명세(bge-m3, dense용)

### 목표 산출물

- `bge-m3.onnx`는 최소로 다음 출력이 필요해요:
  - `last_hidden_state` (shape: `[batch, seq, hidden]`)

이후 pooling/normalize는:

- **(권장) 앱 코드에서** 수행 (명확/검증 쉬움)
- 또는 ONNX 그래프에 포함(고정된 pooling/normalize를 모델 그래프에 “박아 넣기”)

### 변환 방법(예시)

권장 도구:

- `transformers` + `optimum`(onnxruntime) 또는 직접 `torch.onnx.export`

필수 옵션:

- **dynamic axes**: `seq_len`을 동적으로 (문서 길이 변화 지원)
- opset: 17 이상 권장(환경에 맞춰 조정)

검증 체크리스트:

- 같은 입력에 대해 PyTorch vs ONNX의 `cls` 벡터가 거의 동일(허용 오차 내)
- L2 normalize 후의 cosine score가 동일한 ranking을 만드는지 확인

---

## FAISS 인덱스 생성 명세(오프라인 빌드)

### 인덱스 타입(고정)

- `faiss.IndexFlatIP(d=1024)`

### 필수 전처리

- 문서 임베딩 생성 후 **L2 normalize**
- normalize 된 벡터를 `float32`로 유지(성능/정확도 최상)

### 저장

- `faiss.write_index(index, "faiss.index")`

---

## 성능 목표(가이드)

10만 문서, 1024 dims, FlatIP 기준:

- 검색 자체(dot-product)은 충분히 빠른 편이고,
- 체감 병목은 보통 **임베딩 추론(모델 실행)** 쪽이에요.

따라서 런타임 최적화 우선순위:

1. ONNX Runtime EP(Windows: CUDA/DirectML, mac: CoreML 가능 시)
2. 토크나이저 속도(가능하면 Rust/네이티브)
3. 모델 로딩 1회 + warmup 1회
