const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const mainFile = path.join(projectRoot, 'electron', 'main.cjs')

const candidates = [
  path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe'),
  'C:\\Users\\34477\\wukong-player\\node_modules\\electron\\dist\\electron.exe',
]

const electronExe = candidates.find((candidate) => fs.existsSync(candidate))

if (!electronExe) {
  console.error('没有找到可用的 Electron 程序。')
  console.error('可先确认 C:\\Users\\34477\\wukong-player\\node_modules\\electron\\dist\\electron.exe 是否存在。')
  process.exit(1)
}

const child = spawn(electronExe, [mainFile], {
  cwd: projectRoot,
  stdio: 'inherit',
  windowsHide: false,
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
