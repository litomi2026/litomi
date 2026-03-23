# Litomi Mobile

`mobile/`은 `https://litomi.in`을 직접 로드하는 얇은 Capacitor remote-shell 앱입니다.

핵심 동작은 아래와 같습니다.

- 앱 시작: native splash 뒤에 `https://litomi.in`을 바로 로드합니다.
- 인앱 유지 범위: `https://litomi.in` same-origin 페이지만 WebView 안에 남깁니다.
- 외부 링크: 시스템 브라우저로 엽니다.
- 실패 fallback: 네트워크, TLS, HTTP 오류 또는 초기 로드 타임아웃 시 로컬 `error/index.html`을 표시합니다.
- Android back: WebView history가 있으면 뒤로 가고, 없으면 앱을 종료합니다.

자주 쓰는 명령은 아래와 같습니다.

```sh
bun install
bun run assets:generate
bun run sync
bun run android
bun run ios
bun run android:debug
bun run android:release
```
