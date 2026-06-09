const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const projectRoot = path.resolve(__dirname, '..')
const releaseRoot = path.join(projectRoot, 'release')
const productName = 'AI-Python\u5b66\u4e60\u52a9\u624b'
const outputDir = path.join(releaseRoot, 'AI-Python-Learning-Assistant-win')
const iconPath = path.join(projectRoot, 'assets', 'app-icon.ico')
const backendBuildRoot = path.join(projectRoot, 'build', 'backend')
const backendDistRoot = path.join(backendBuildRoot, 'dist')
const backendExe = path.join(backendDistRoot, 'a3-backend.exe')
const electronDistCandidates = [
  path.join(projectRoot, 'node_modules', 'electron', 'dist'),
  'C:\\Users\\34477\\wukong-player\\node_modules\\electron\\dist',
]
const rceditCandidates = [
  path.join(projectRoot, 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe'),
]

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function buildBackendRuntime() {
  fs.rmSync(backendBuildRoot, { recursive: true, force: true })
  fs.mkdirSync(backendBuildRoot, { recursive: true })

  const result = spawnSync(
    'python',
    [
      '-m',
      'PyInstaller',
      '--noconfirm',
      '--clean',
      '--onefile',
      '--name',
      'a3-backend',
      '--distpath',
      backendDistRoot,
      '--workpath',
      path.join(backendBuildRoot, 'work'),
      '--specpath',
      path.join(backendBuildRoot, 'spec'),
      '--paths',
      projectRoot,
      '--collect-submodules',
      'uvicorn',
      '--collect-submodules',
      'backend',
      path.join(projectRoot, 'backend', 'desktop_server.py'),
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
    },
  )

  if (result.status !== 0 || !fs.existsSync(backendExe)) {
    console.error('\u540e\u7aef\u8fd0\u884c\u65f6\u6253\u5305\u5931\u8d25\u3002')
    process.exit(result.status || 1)
  }
}

runNodeScript(path.join(projectRoot, 'scripts', 'generate-icon.cjs'))
buildBackendRuntime()

const electronDist = electronDistCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'electron.exe')),
)

if (!electronDist) {
  console.error('\u6ca1\u6709\u627e\u5230\u53ef\u7528\u7684 Electron \u8fd0\u884c\u65f6\u3002')
  console.error('\u8bf7\u786e\u8ba4\u672c\u9879\u76ee\u6216 C:\\Users\\34477\\wukong-player\\node_modules\\electron\\dist\\electron.exe \u5b58\u5728\u3002')
  process.exit(1)
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) {
    return
  }
  fs.cpSync(from, to, { recursive: true, force: true })
}

function setExeIcon(exePath) {
  const rcedit = rceditCandidates.find((candidate) => fs.existsSync(candidate))
  if (!rcedit || !fs.existsSync(iconPath)) {
    console.warn('\u672a\u627e\u5230 rcedit \u6216\u56fe\u6807\u6587\u4ef6\uff0c\u7a97\u53e3\u56fe\u6807\u4ecd\u4f1a\u751f\u6548\uff0c\u4f46 exe \u6587\u4ef6\u56fe\u6807\u53ef\u80fd\u4fdd\u6301\u9ed8\u8ba4\u3002')
    return
  }

  const result = spawnSync(
    rcedit,
    [
      exePath,
      '--set-icon',
      iconPath,
      '--set-version-string',
      'ProductName',
      productName,
      '--set-version-string',
      'FileDescription',
      productName,
      '--set-version-string',
      'InternalName',
      productName,
      '--set-version-string',
      'OriginalFilename',
      `${productName}.exe`,
    ],
    { stdio: 'inherit' },
  )

  if (result.status !== 0) {
    console.warn('exe \u56fe\u6807\u5199\u5165\u5931\u8d25\uff0c\u5e94\u7528\u4ecd\u53ef\u8fd0\u884c\u3002')
  }
}

function preparePortableData() {
  const dataDir = path.join(outputDir, 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(path.join(dataDir, 'sessions'), { recursive: true })
  copyIfExists(path.join(projectRoot, 'data', 'materials'), path.join(dataDir, 'materials'))
  copyIfExists(path.join(projectRoot, 'data', 'index'), path.join(dataDir, 'index'))
  copyIfExists(path.join(projectRoot, 'data', 'app_settings.json'), path.join(dataDir, 'app_settings.json'))
}

fs.rmSync(outputDir, { recursive: true, force: true })
fs.mkdirSync(outputDir, { recursive: true })

fs.cpSync(electronDist, outputDir, { recursive: true, force: true })

const originalExe = path.join(outputDir, 'electron.exe')
const appExe = path.join(outputDir, `${productName}.exe`)
if (fs.existsSync(originalExe)) {
  setExeIcon(originalExe)
  fs.renameSync(originalExe, appExe)
}

const resourcesDir = path.join(outputDir, 'resources')
const appDir = path.join(resourcesDir, 'app')
fs.mkdirSync(appDir, { recursive: true })

copyIfExists(path.join(projectRoot, 'electron'), path.join(appDir, 'electron'))
copyIfExists(path.join(projectRoot, 'assets'), path.join(resourcesDir, 'assets'))
copyIfExists(path.join(projectRoot, 'dist'), path.join(resourcesDir, 'dist'))
copyIfExists(path.join(projectRoot, 'backend'), path.join(resourcesDir, 'backend'))
copyIfExists(backendDistRoot, path.join(resourcesDir, 'backend-runtime'))
preparePortableData()

fs.writeFileSync(
  path.join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: 'a3-learning-agent-desktop',
      version: '0.0.0',
      main: 'electron/main.cjs',
    },
    null,
    2,
  ),
  'utf8',
)

console.log(`\u5df2\u751f\u6210\uff1a${outputDir}`)
console.log(`\u53cc\u51fb\u8fd0\u884c\uff1a${appExe}`)
