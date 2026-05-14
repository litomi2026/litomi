import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const mobileDir = path.resolve(import.meta.dirname, '..')
const sourcePath = path.resolve(mobileDir, '../public/web-app-manifest-512x512.png')
const white = { r: 255, g: 255, b: 255, alpha: 1 }
const transparent = { r: 255, g: 255, b: 255, alpha: 0 }

const androidIconTargets = [
  ['mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48],
  ['mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72],
  ['mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96],
  ['mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144],
  ['mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192],
]

const androidForegroundTargets = [
  ['mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 48],
  ['mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 72],
  ['mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 96],
  ['mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 144],
  ['mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 192],
]

const androidRoundTargets = [
  ['mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48],
  ['mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72],
  ['mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96],
  ['mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144],
  ['mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192],
]

const androidSplashTargets = [
  ['mobile/android/app/src/main/res/drawable-port-mdpi/splash.png', 320, 480],
  ['mobile/android/app/src/main/res/drawable-port-hdpi/splash.png', 480, 800],
  ['mobile/android/app/src/main/res/drawable-port-xhdpi/splash.png', 720, 1280],
  ['mobile/android/app/src/main/res/drawable-port-xxhdpi/splash.png', 960, 1600],
  ['mobile/android/app/src/main/res/drawable-port-xxxhdpi/splash.png', 1280, 1920],
  ['mobile/android/app/src/main/res/drawable-land-mdpi/splash.png', 480, 320],
  ['mobile/android/app/src/main/res/drawable-land-hdpi/splash.png', 800, 480],
  ['mobile/android/app/src/main/res/drawable-land-xhdpi/splash.png', 1280, 720],
  ['mobile/android/app/src/main/res/drawable-land-xxhdpi/splash.png', 1600, 960],
  ['mobile/android/app/src/main/res/drawable-land-xxxhdpi/splash.png', 1920, 1280],
  ['mobile/android/app/src/main/res/drawable/splash.png', 480, 320],
]

const iosIconTarget = ['mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024]

const iosSplashTargets = [
  ['mobile/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png', 2732, 2732],
  ['mobile/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png', 2732, 2732],
  ['mobile/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png', 2732, 2732],
]

async function ensureDir(targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
}

async function main() {
  await fs.access(sourcePath)

  await Promise.all([
    ...androidIconTargets.map(([target, size]) => makePaddedSquare(path.resolve(mobileDir, '..', target), size, white)),
    ...androidRoundTargets.map(([target, size]) => makePaddedSquare(path.resolve(mobileDir, '..', target), size, white)),
    ...androidForegroundTargets.map(([target, size]) =>
      makePaddedSquare(path.resolve(mobileDir, '..', target), size, transparent, 0.76),
    ),
    ...androidSplashTargets.map(([target, width, height]) => makeSplash(path.resolve(mobileDir, '..', target), width, height)),
    makePaddedSquare(path.resolve(mobileDir, '..', iosIconTarget[0]), iosIconTarget[1], white),
    ...iosSplashTargets.map(([target, width, height]) => makeSplash(path.resolve(mobileDir, '..', target), width, height)),
  ])

  console.log('Native icons and splash assets updated from', sourcePath)
}

async function makePaddedSquare(targetPath, size, background, scale = 0.84) {
  const inset = Math.round(size * scale)
  const inner = await sharp(sourcePath).resize(inset, inset, { fit: 'contain' }).png().toBuffer()

  await ensureDir(targetPath)
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(targetPath)
}

async function makeSplash(targetPath, width, height) {
  const logoSize = Math.round(Math.min(width, height) * 0.46)
  const inner = await sharp(sourcePath).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer()

  await ensureDir(targetPath)
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: white,
    },
  })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(targetPath)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
