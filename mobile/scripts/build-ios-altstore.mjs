import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mobileDir = path.resolve(__dirname, '..')

const packageJson = readJson(path.join(mobileDir, 'package.json'))
const capacitorConfig = readJson(path.join(mobileDir, 'capacitor.config.json'))
const altstoreConfig = readJson(path.join(mobileDir, 'altstore.config.json'))

const versionName = String(packageJson.version ?? '').trim()
const versionParts = versionName.split('.').map((value) => Number.parseInt(value, 10))

if (versionParts.length !== 3 || versionParts.some((value) => Number.isNaN(value))) {
  throw new Error(`mobile/package.json version must use numeric MAJOR.MINOR.PATCH. Received: ${versionName}`)
}

const [major, minor, patch] = versionParts
const buildNumber = String(major * 1_000_000 + minor * 1_000 + patch)

const releaseTag = process.env.ALTSTORE_RELEASE_TAG || `mobile-ios-altstore-v${versionName}`
const repositoryUrl = normalizeRepositoryUrl(process.env.ALTSTORE_REPOSITORY_URL || getGitRemoteUrl())
const releaseBaseUrl = (process.env.ALTSTORE_RELEASE_BASE_URL || `${repositoryUrl}/releases`).replace(/\/+$/, '')
const sourceBranch = process.env.ALTSTORE_SOURCE_BRANCH || 'main'
const sourceRepositoryPath = path.join(mobileDir, 'altstore', 'source.json')
const sourceUrl = process.env.ALTSTORE_SOURCE_URL || getRawGitHubUrl(repositoryUrl, sourceBranch, 'mobile/altstore/source.json')

const archivePath = path.join(mobileDir, 'build', 'ios-archive', 'Litomi.xcarchive')
const payloadRoot = path.join(mobileDir, 'build', 'ios-altstore-payload')
const payloadDir = path.join(payloadRoot, 'Payload')
const artifactsDir = path.join(mobileDir, 'artifacts', 'ios')

const ipaName = 'litomi-ios-altstore.ipa'
const dsymsName = 'litomi-ios-altstore-dSYMs.zip'
const sourceName = 'litomi-altstore-source.json'
const buildInfoName = 'litomi-ios-altstore-build-info.txt'

const ipaPath = path.join(artifactsDir, ipaName)
const dsymsPath = path.join(artifactsDir, dsymsName)
const sourcePath = path.join(artifactsDir, sourceName)
const buildInfoPath = path.join(artifactsDir, buildInfoName)

fs.rmSync(archivePath, { recursive: true, force: true })
fs.rmSync(payloadRoot, { recursive: true, force: true })
fs.rmSync(artifactsDir, { recursive: true, force: true })
fs.mkdirSync(payloadDir, { recursive: true })
fs.mkdirSync(artifactsDir, { recursive: true })

run('bun', ['run', 'sync:ios'], { cwd: mobileDir })

run(
  'xcodebuild',
  [
    '-project',
    'ios/App/App.xcodeproj',
    '-scheme',
    'App',
    '-configuration',
    'Release',
    '-destination',
    'generic/platform=iOS',
    '-archivePath',
    archivePath,
    `MARKETING_VERSION=${versionName}`,
    `CURRENT_PROJECT_VERSION=${buildNumber}`,
    'CODE_SIGNING_ALLOWED=NO',
    'archive',
  ],
  { cwd: mobileDir },
)

const applicationPath = readPlistValue(path.join(archivePath, 'Info.plist'), 'ApplicationProperties:ApplicationPath')

if (typeof applicationPath !== 'string' || applicationPath.length === 0) {
  throw new Error(`Could not determine built app path from ${path.join(archivePath, 'Info.plist')}`)
}

const appPath = path.join(archivePath, 'Products', applicationPath)
const appInfoPath = path.join(appPath, 'Info.plist')

if (!fs.existsSync(appInfoPath)) {
  throw new Error(`Built app Info.plist not found at ${appInfoPath}`)
}

const appInfo = readPlist(appInfoPath)
const bundleIdentifier = String(appInfo.CFBundleIdentifier || capacitorConfig.appId || '').trim()
const displayName = String(appInfo.CFBundleDisplayName || appInfo.CFBundleName || altstoreConfig.app?.name || '').trim()
const minOSVersion = String(appInfo.MinimumOSVersion || detectDeploymentTarget(path.join(mobileDir, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')) || '').trim()

if (!bundleIdentifier) {
  throw new Error('Could not determine iOS bundle identifier for AltStore source generation.')
}

if (!displayName) {
  throw new Error('Could not determine iOS display name for AltStore packaging.')
}

if (containsNonAscii(displayName)) {
  throw new Error(
    `iOS display name must stay ASCII for this AltStore Classic flow. Received: ${displayName}. Update mobile/ios/App/App/Info.plist.`,
  )
}

const builtAppDirName = path.basename(appPath)
const payloadAppPath = path.join(payloadDir, builtAppDirName)
fs.cpSync(appPath, payloadAppPath, { recursive: true })

run('ditto', ['-c', '-k', '--norsrc', '--keepParent', 'Payload', ipaPath], { cwd: payloadRoot })

if (!fs.existsSync(path.join(archivePath, 'dSYMs'))) {
  throw new Error(`dSYMs directory not found in ${archivePath}`)
}

run('ditto', ['-c', '-k', '--norsrc', '--keepParent', 'dSYMs', dsymsPath], { cwd: archivePath })

const privacy = Object.fromEntries(
  Object.entries(appInfo)
    .filter(([key, value]) => key.endsWith('UsageDescription') && typeof value === 'string')
    .map(([key, value]) => [key, value]),
)

const entitlements = collectEntitlements(path.join(mobileDir, 'ios'))
const today = new Date().toISOString().slice(0, 10)
const ipaSize = fs.statSync(ipaPath).size

const sourceJson = {
  name: altstoreConfig.source.name,
  subtitle: altstoreConfig.source.subtitle,
  description: altstoreConfig.source.description,
  iconURL: altstoreConfig.source.iconURL,
  website: altstoreConfig.source.website,
  tintColor: altstoreConfig.source.tintColor,
  featuredApps: [bundleIdentifier],
  apps: [
    {
      name: altstoreConfig.app.name,
      bundleIdentifier,
      developerName: altstoreConfig.app.developerName,
      subtitle: altstoreConfig.app.subtitle,
      localizedDescription: altstoreConfig.app.localizedDescription,
      iconURL: altstoreConfig.app.iconURL,
      tintColor: altstoreConfig.app.tintColor,
      category: altstoreConfig.app.category,
      versions: [
        {
          version: versionName,
          buildVersion: buildNumber,
          date: today,
          localizedDescription: altstoreConfig.app.versionDescription,
          downloadURL: `${releaseBaseUrl}/download/${releaseTag}/${ipaName}`,
          size: ipaSize,
          minOSVersion,
        },
      ],
      appPermissions: {
        entitlements,
        privacy,
      },
    },
  ],
  news: [],
}

fs.writeFileSync(sourcePath, `${JSON.stringify(sourceJson, null, 2)}\n`)
fs.mkdirSync(path.dirname(sourceRepositoryPath), { recursive: true })
fs.writeFileSync(sourceRepositoryPath, `${JSON.stringify(sourceJson, null, 2)}\n`)

const buildInfoLines = [
  `version_name=${versionName}`,
  `build_number=${buildNumber}`,
  `bundle_id=${bundleIdentifier}`,
  `display_name=${displayName}`,
  `minimum_ios_version=${minOSVersion}`,
  `release_tag=${releaseTag}`,
  `repository_url=${repositoryUrl}`,
  `source_url=${sourceUrl}`,
  `ipa_download_url=${releaseBaseUrl}/download/${releaseTag}/${ipaName}`,
  `ipa_asset=${ipaName}`,
  `dsyms_asset=${dsymsName}`,
  `source_asset=${sourceName}`,
  `note=AltStore Classic distribution requires users to install with AltStore and refresh through AltServer using their own Apple account.`,
]

fs.writeFileSync(buildInfoPath, `${buildInfoLines.join('\n')}\n`)

for (const filePath of [ipaPath, dsymsPath, sourcePath, buildInfoPath]) {
  const digestPath = `${filePath}.sha256`
  fs.writeFileSync(digestPath, `${sha256(filePath)}\n`)
}

console.log('Prepared AltStore Classic assets:')
console.log(`  version_name=${versionName}`)
console.log(`  build_number=${buildNumber}`)
console.log(`  ipa=${ipaPath}`)
console.log(`  source=${sourcePath}`)
console.log(`  source_url=${sourceUrl}`)

function collectEntitlements(rootDir) {
  const candidates = findFiles(rootDir, (filePath) => filePath.endsWith('.entitlements') || filePath.endsWith('.xcent'))
  const keys = new Set()

  for (const filePath of candidates) {
    let data
    try {
      data = readPlist(filePath)
    } catch {
      continue
    }

    for (const key of Object.keys(data)) {
      if (key === 'application-identifier' || key === 'com.apple.developer.team-identifier') {
        continue
      }

      keys.add(key)
    }
  }

  return [...keys].sort()
}

function containsNonAscii(value) {
  for (const char of value) {
    if ((char.codePointAt(0) ?? 0) > 0x7f) {
      return true
    }
  }

  return false
}

function detectDeploymentTarget(projectFilePath) {
  const projectText = fs.readFileSync(projectFilePath, 'utf8')
  const match = projectText.match(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/)
  return match?.[1] || ''
}

function findFiles(rootDir, predicate) {
  const results = []
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name.startsWith('.')) {
      continue
    }

    const filePath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      results.push(...findFiles(filePath, predicate))
      continue
    }

    if (predicate(filePath)) {
      results.push(filePath)
    }
  }

  return results
}

function getGitRemoteUrl() {
  return execFileSync('git', ['config', '--get', 'remote.origin.url'], {
    cwd: mobileDir,
    encoding: 'utf8',
  }).trim()
}

function getRawGitHubUrl(repoUrl, branchName, filePath) {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/)

  if (!match) {
    throw new Error(
      `Could not derive a raw GitHub URL from ${repoUrl}. Set ALTSTORE_SOURCE_URL explicitly if you are not using GitHub.`,
    )
  }

  const [, owner, repo] = match
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/${filePath}`
}

function normalizeRepositoryUrl(remoteUrl) {
  if (!remoteUrl) {
    throw new Error(
      'Could not resolve repository URL. Set ALTSTORE_REPOSITORY_URL or configure git remote.origin.url before building AltStore assets.',
    )
  }

  const trimmed = remoteUrl.trim().replace(/\/+$/, '')
  const sshMatch = trimmed.match(/^git@github\.com:(.+?)(?:\.git)?$/)
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}`
  }

  const httpsMatch = trimmed.match(/^https:\/\/github\.com\/(.+?)(?:\.git)?$/)
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1]}`
  }

  return trimmed.replace(/\.git$/, '')
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readPlist(filePath) {
  const raw = execFileSync('plutil', ['-convert', 'json', '-o', '-', filePath], {
    encoding: 'utf8',
  })
  return JSON.parse(raw)
}

function readPlistValue(filePath, keyPath) {
  return execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${keyPath}`, filePath], {
    encoding: 'utf8',
  }).trim()
}

function run(command, args, options) {
  execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
  })
}

function sha256(filePath) {
  const hash = createHash('sha256')
  hash.update(fs.readFileSync(filePath))
  return hash.digest('hex')
}
