# Litomi Mobile

`mobile/`은 `https://litomi.in`을 직접 여는 최소 Capacitor 앱입니다.

이 디렉터리는 로컬 웹앱을 따로 구현하는 공간이 아니라, 모바일 셸과 네이티브 빌드 설정을 관리하는 용도입니다.

## 현재 구조

- 앱 시작 시 Capacitor가 `https://litomi.in`을 직접 로드합니다.
- 로컬 `web/` 폴더는 `webDir` 요구사항을 맞추기 위한 최소 placeholder만 가집니다.
- Android/iOS 플랫폼 디렉터리 안에는 Capacitor가 생성한 파일이 많고, 우리가 직접 관리하는 파일은 일부 설정 파일뿐입니다.

## 소스 오브 트루스

주요 관리 파일은 아래 정도만 보면 됩니다.

- `capacitor.config.ts`
- `package.json`
- `web/index.html`
- `android/app/build.gradle`
- `android/build.gradle`
- `android/gradle/wrapper/gradle-wrapper.properties`

## 생성물

아래 경로는 다시 만들 수 있는 생성물입니다.

- `node_modules/`
- `android/app/src/main/assets/`
- `ios/App/App/public/`
- `ios/App/App/capacitor.config.json`
- `ios/App/App/config.xml`
- `android/.gradle/`
- `android/app/build/`

## 자주 쓰는 명령

```sh
bun install
bun run assets:generate
bun run sync
bun run android
bun run ios
bun run android:debug
bun run android:release
```

## 메모

- 아이콘과 스플래시는 루트 `public/web-app-manifest-512x512.png`를 기준으로 생성합니다.
- Android 빌드는 현재 저장소에 맞춘 Gradle/AGP 설정을 사용합니다.
