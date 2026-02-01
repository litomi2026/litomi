## litomi-local-search (로컬 시맨틱 검색 실행파일)

`huggingface/LOCAL_SEMANTIC_SEARCH_SPEC.md` 기준으로, 로컬에서 bge-m3(ONNX)로 임베딩을 만들고 `vectors.f32`(FlatIP)로 검색하는 로컬 HTTP 서버예요.

### 1) 준비물

- Rust toolchain (`cargo`)
  - macOS: `rustup` 설치 후 `cargo --version` 확인
  - Windows: `rustup-init.exe`로 설치
- Python 3.10+ (모델 ONNX export용)

### 2) bge-m3 ONNX + tokenizer.json 만들기

레포 루트에서:

```bash
python -m venv .venv
./.venv/bin/pip install -r huggingface/requirements-export-onnx.txt
./.venv/bin/python huggingface/export_bge_m3_dense_onnx.py --out-dir data/model --verify
```

결과:

- `data/model/bge-m3.onnx`
- `data/model/tokenizer.json`

### 3) (선택) onnxruntime dylib/dll 준비

이 프로젝트는 Rust에서 `ort`의 `load-dynamic` 로딩을 지원해요. 보통은 **onnxruntime 릴리즈 zip에서 dylib/dll 경로를 지정**하는 게 가장 확실해요.

- macOS 예시: `.../lib/libonnxruntime.dylib`
- Windows 예시: `...\\onnxruntime.dll`

이 경로는 `--ort-dylib`로 넘겨요(아래 참고).

이미 venv에 `onnxruntime`(Python)이 설치돼 있으면, 거기 들어있는 dylib를 그대로 재사용할 수도 있어요(macOS 예시):

```bash
ORT_DYLIB="$(
  ./.venv/bin/python -c "import onnxruntime, pathlib; capi=pathlib.Path(onnxruntime.__file__).resolve().parent/'capi'; print(next(capi.glob('libonnxruntime.*.dylib')))"
)"
echo "$ORT_DYLIB"
```

### 4) 인덱스 빌드(오프라인)

레포 루트에서:

```bash
cargo run --manifest-path local-search/Cargo.toml --release -- \
  build-index \
  --input search/summary.txt \
  --out data/index \
  --model-dir data/model
```

onnxruntime 동적 로딩이 필요하면:

```bash
cargo run --manifest-path local-search/Cargo.toml --release -- \
  build-index \
  --input search/summary.txt \
  --out data/index \
  --model-dir data/model \
  --ort-dylib "/path/to/libonnxruntime.dylib"
```

결과:

- `data/index/doc_meta.sqlite`
- `data/index/vectors.f32`

### 5) 서버 실행

```bash
cargo run --manifest-path local-search/Cargo.toml --release -- \
  serve \
  --data-dir data
```

onnxruntime 동적 로딩이 필요하면:

```bash
cargo run --manifest-path local-search/Cargo.toml --release -- \
  serve \
  --data-dir data \
  --ort-dylib "/path/to/libonnxruntime.dylib"
```

기본 바인딩/포트:

- `127.0.0.1:17777` (충돌 시 17877까지 탐색)

### 6) 결과 확인(curl)

```bash
curl -s "http://127.0.0.1:17777/healthz" | jq
```

```bash
curl -s "http://127.0.0.1:17777/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"어떤 국왕에게 프리렌과 페른 모두 뺏기고 절망하는 슈타르크가 나오는 만화","topK":10,"includeSnippet":true}' \
  | jq
```

### 7) 배포물(zip) 만들기(권장 폴더 구조)

아래 구조로 묶으면 스펙의 `data/model`, `data/index` 레이아웃을 그대로 가져갈 수 있어요:

```
dist/local-search/
  bin/
    litomi-local-search         (macOS)
    litomi-local-search.exe     (Windows)
  data/
    model/
      bge-m3.onnx
      tokenizer.json
    index/
      doc_meta.sqlite
      vectors.f32
  scripts/
    run-macos.sh
    run-windows.ps1
  onnxruntime/                  (선택: dylib/dll을 같이 포함할 경우)
```

빌드(레포 루트에서):

```bash
cargo build --release --manifest-path local-search/Cargo.toml
```

바이너리 위치:

- macOS: `local-search/target/release/litomi-local-search`
- Windows: `local-search\\target\\release\\litomi-local-search.exe`

`dist/local-search/`에 복사한 뒤 실행은:

- macOS: `bash dist/local-search/scripts/run-macos.sh`
- Windows: `powershell -ExecutionPolicy Bypass -File dist\\local-search\\scripts\\run-windows.ps1`

onnxruntime 동적 로딩을 쓰는 경우:

- `LITOMI_ORT_DYLIB` 환경변수로 dylib/dll 경로를 넘겨요(스크립트가 이를 읽어요).
