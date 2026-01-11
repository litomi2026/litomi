# Mobile distribution (no store listing)

## End-user install link

- Share `https://litomi.in/app` (or your own domain + `/app`)
- Android APK download is fixed to GitHub Releases (no env needed):
  - `https://github.com/gwak2837/litomi/releases/latest/download/litomi.apk`
- iOS TestFlight is optional (show the button only when set):
  - `NEXT_PUBLIC_IOS_TESTFLIGHT_URL`

## Android (APK sideload)

### Recommended (GitHub Releases + GitHub Actions)

This repo includes a workflow that publishes `litomi.apk` and `litomi.apk.sha256` to GitHub Releases on tag push.

Tag format:
- `vMAJOR.MINOR.PATCH` (example: `v1.2.3`)

Secrets to add (GitHub → Settings → Secrets and variables → Actions):
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

How to create `ANDROID_KEYSTORE_BASE64` (from your local keystore):

```bash
base64 -i android/keystore/release.jks | pbcopy
```

Release:

```bash
git tag v1.2.3
git push origin v1.2.3
```

### One-time setup (recommended)

1) Create a release keystore (keep it safe):

```bash
mkdir -p android/keystore
keytool -genkeypair -v \
  -keystore android/keystore/release.jks \
  -alias litomi \
  -keyalg RSA -keysize 2048 -validity 10000
```

2) Copy and fill `android/keystore.properties`:

- Copy `android/keystore.properties.template` → `android/keystore.properties`
- Fill `storePassword`
- `keyPassword`는 선택이에요. `keytool`에서 비밀번호 1개로 진행했다면 비워도 돼요. (storePassword를 그대로 써요)

### Build (one command)

```bash
bun run android:release
```

Outputs:
- `dist/android/litomi.apk`
- `dist/android/litomi.apk.sha256`

### Upload

The workflow uploads these assets to the GitHub Release:
- `litomi.apk`
- `litomi.apk.sha256`

## iOS (TestFlight)

### One-time setup

1) In App Store Connect:
- Create the app (bundle id: `in.litomi.app`)
- Enable TestFlight
- Create a public TestFlight link (external testers)

2) Set:
- `NEXT_PUBLIC_IOS_TESTFLIGHT_URL` = your TestFlight public link (e.g. `https://testflight.apple.com/join/XXXXXXX`)

### Upload a build (minimal clicks)

```bash
bun run ios:testflight
```

Then in Xcode:
- Product → Archive
- Distribute App → App Store Connect → Upload

After processing, the build appears in TestFlight for testers.

