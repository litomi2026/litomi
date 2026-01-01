# character.json (ko) 공식화 작업 TODO

이 문서는 `src/translation/character.json`의 **한국어(ko) 표기를 “공식 용어 우선순위”**로 정리하는 작업을 **멈추지 않고 이어가기 위한 체크리스트**예요.

## 작업 원칙(요약)

- **우선순위**: (A) 공식 표기 → (B) Wikipedia/Wikidata → (C) 팬덤/나무위키/관용 표기
- **애매하면**: 값은 유지하고 `tools/character-ko-needs-verification.md`에 기록해요.
- **표기 규칙**: 공식 표기 그대로(가운뎃점(·)/띄어쓰기/장음 포함)예요.

## 진행 현황

- [x] `tools/auditCharacterTranslations.ts`로 자동 감사(누락/의심/중복) 파이프라인 만들기
- [x] `ko`의 **명백한 오염(일본어/깨짐/언더스코어/불필요한 괄호 등)** 후보를 우선 정리하기
- [x] 감사 스크립트의 **오탐(모델명/이니셜)**을 줄여서 신호를 키우기
- [ ] 포켓몬/게임 로컬라이징에서 **확실한 오역**을 계속 찾아 고치기
- [ ] `tools/character-ko-needs-verification.md`의 항목을 하나씩 공식 근거로 확정/정리하기

## 다음 배치(실행 순서)

1. `bun tools/auditCharacterTranslations.ts --no-write --limit 50` 출력에서 **진짜로 이상한 케이스**만 골라요.
2. **확실히 근거가 나오는 항목만** `character.json`을 수정해요.
3. 애매하면 **수정하지 않고** 검증 리스트에만 추가해요.
4. `bun test src/translation/__tests__/character.test.ts`로 회귀 확인해요.
