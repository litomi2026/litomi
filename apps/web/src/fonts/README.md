# 폰트 최적화 (Font Optimization)

웹 폰트의 로딩 속도를 개선하기 위해 `PretendardVariable` 폰트를 최적화하여 사용합니다. 불필요한 굵기(Weight)와 잘 사용되지 않는 글리프(Glyph)를 제거하고, 필수적인 OpenType 기능만 남겨 용량을 최소화합니다.

## 사전 준비 (Prerequisites)

폰트 최적화 도구인 `fonttools`와 압축을 위한 `brotli`를 설치해야 합니다.

```bash
python3 -m pip install fonttools brotli
```

## 1. Font Weight 최적화

웹에서 주로 사용하는 `400` (Regular)부터 `700` (Bold) 사이의 가중치만 남깁니다.
원본 범위(`45`~`920`)를 줄여 파일 크기를 줄입니다.

**입력 파일:** `PretendardVariable.woff2`
**출력 파일:** `PretendardVariable.400-700.woff2`

```bash
fonttools varLib.instancer \
  --output="PretendardVariable.400-700.woff2" \
  PretendardVariable.woff2 \
  wght=400:700
```

## 2. 글리프(Glyph) 및 기능(Feature) 최적화 (Subsetting)

자주 사용하는 한글 2,350자 + 추가 글자 등 약 3,713자만 남기고 나머지는 제거합니다.
또한 `font-variant-numeric: tabular-nums` (고정폭 숫자) 기능을 사용하기 위해 `tnum`을 포함한 필수 레이아웃 기능을 명시적으로 지정합니다.

> **주의:** `--layout-features` 옵션을 생략하거나 잘못 설정하면 숫자 고정폭 기능이 작동하지 않을 수 있습니다.

- **필수 유지 파일:** `glyphs.txt` (사용할 문자 목록이 포함된 텍스트 파일)
- **입력 파일:** `PretendardVariable.400-700.woff2` (1단계 결과물)
- **출력 파일:** `PretendardVariable.400-700.3713.woff2` (최종 결과물)

```bash
pyftsubset PretendardVariable.400-700.woff2 \
  --flavor="woff2" \
  --output-file="PretendardVariable.400-700.3713.woff2" \
  --text-file="glyphs.txt" \
  --layout-features="calt,ccmp,kern,locl,mark,mkmk,rlig,tnum"
```

### 유지된 레이아웃 기능 설명

- `tnum`: Tabular Figures (고정폭 숫자) - 숫자 너비를 일정하게 맞춤
- `kern`: Kerning (자간 조정) - 글자 사이 간격 미세 조정
- `calt`: Contextual Alternates - 문맥에 따른 글자 대체
- `ccmp`: Glyph Composition/Decomposition - 자모 결합/분해 (한글 필수)
- `locl`: Localized Forms - 언어별 특수 형태 (한국어 문장부호 등)
- `mark`, `mkmk`: Mark Positioning - 자모 위치 배치 (한글 필수)
- `rlig`: Required Ligatures - 필수 합자

## 결과

이 과정을 통해 원본 대비 최대 **80% 이상**의 용량을 절약할 수 있으며, 웹페이지 로딩 성능이 크게 향상됩니다.

## 참고

- https://github.com/fonttools/fonttools
- https://fonttools.readthedocs.io/en/latest/subset/index.html#module-fontTools.subset
