const { app, BrowserWindow, Menu, dialog, nativeTheme, shell } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const http = require('node:http')
const net = require('node:net')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const BACKEND_PORT = 8000
const BACKEND_HOST = '127.0.0.1'
const APP_TITLE = 'AI-Python \u5b66\u4e60\u52a9\u624b'
const TITLEBAR_HEIGHT = 38
const TITLEBAR_COLOR = '#edf4fb'
const TITLEBAR_SYMBOL_COLOR = '#162033'

let backendProcess = null
let frontendServer = null

function getRootDir() {
  return app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..')
}

function getAssetPath(...segments) {
  const candidates = [
    path.join(getRootDir(), 'assets', ...segments),
    path.join(path.resolve(__dirname, '..'), 'assets', ...segments),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate))
}

function getDataDir() {
  return app.isPackaged ? path.join(path.dirname(process.execPath), 'data') : path.join(getRootDir(), 'data')
}

function isPortOpen(port, host = BACKEND_HOST) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(700)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(false))
    socket.connect(port, host)
  })
}

async function waitForPort(port, host = BACKEND_HOST, timeoutMs = 18000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port, host)) {
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 350))
  }
  return false
}

async function startBackend(rootDir) {
  if (await isPortOpen(BACKEND_PORT)) {
    return
  }

  const pythonCommand = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
  const dataDir = getDataDir()
  fs.mkdirSync(dataDir, { recursive: true })

  backendProcess = spawn(
    pythonCommand,
    ['-m', 'uvicorn', 'backend.app:app', '--host', BACKEND_HOST, '--port', String(BACKEND_PORT)],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
        A3_DATA_DIR: dataDir,
      },
      windowsHide: true,
      stdio: 'ignore',
    },
  )

  backendProcess.once('exit', () => {
    backendProcess = null
  })

  const ready = await waitForPort(BACKEND_PORT)
  if (!ready) {
    dialog.showErrorBox(
      '\u540e\u7aef\u542f\u52a8\u5931\u8d25',
      '\u6ca1\u6709\u6210\u529f\u542f\u52a8\u672c\u5730\u5b66\u4e60\u52a9\u624b\u670d\u52a1\u3002\u8bf7\u786e\u8ba4 Python \u548c\u540e\u7aef\u4f9d\u8d56\u5df2\u7ecf\u5b89\u88c5\u3002',
    )
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }
  return types[ext] || 'application/octet-stream'
}

function proxyApiRequest(req, res) {
  const proxyReq = http.request(
    {
      host: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ detail: '\u672c\u5730\u5b66\u4e60\u52a9\u624b\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\u3002' }))
  })

  req.pipe(proxyReq)
}

function startFrontendServer(rootDir) {
  const distDir = path.join(rootDir, 'dist')
  const indexPath = path.join(distDir, 'index.html')

  if (!fs.existsSync(indexPath)) {
    return null
  }

  frontendServer = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${BACKEND_HOST}`)
    if (requestUrl.pathname.startsWith('/api')) {
      proxyApiRequest(req, res)
      return
    }

    const decodedPath = decodeURIComponent(requestUrl.pathname)
    const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
    const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '')
    const filePath = path.join(distDir, safePath)
    const resolvedPath = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? filePath : indexPath

    if (!resolvedPath.startsWith(distDir)) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    res.writeHead(200, { 'Content-Type': getContentType(resolvedPath) })
    fs.createReadStream(resolvedPath).pipe(res)
  })

  return new Promise((resolve) => {
    frontendServer.listen(0, BACKEND_HOST, () => {
      const address = frontendServer.address()
      resolve(`http://${BACKEND_HOST}:${address.port}`)
    })
  })
}

function installDesktopChrome(win) {
  win.webContents.once('did-finish-load', async () => {
    await win.webContents.insertCSS(`
      body.electron-window::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: ${TITLEBAR_HEIGHT}px;
        z-index: 2147483647;
        background: ${TITLEBAR_COLOR};
        -webkit-app-region: drag;
      }

      body.electron-window .app-shell {
        padding-top: ${18 + TITLEBAR_HEIGHT}px;
      }

      body.electron-window button,
      body.electron-window input,
      body.electron-window textarea,
      body.electron-window select,
      body.electron-window a {
        -webkit-app-region: no-drag;
      }
    `)
    await win.webContents.executeJavaScript("document.body.classList.add('electron-window')")
  })
}

function isExternalWebUrl(targetUrl) {
  try {
    const parsed = new URL(targetUrl)
    const localHosts = new Set([BACKEND_HOST, 'localhost', '::1'])
    return ['http:', 'https:'].includes(parsed.protocol) && !localHosts.has(parsed.hostname)
  } catch {
    return false
  }
}

function openExternalUrl(targetUrl) {
  if (!isExternalWebUrl(targetUrl)) {
    return false
  }
  void shell.openExternal(targetUrl)
  return true
}

function installExternalLinkHandling(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (openExternalUrl(url)) {
      return { action: 'deny' }
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (openExternalUrl(url)) {
      event.preventDefault()
    }
  })
}

async function createWindow() {
  const rootDir = getRootDir()
  await startBackend(rootDir)

  app.setName(APP_TITLE)
  nativeTheme.themeSource = 'light'
  Menu.setApplicationMenu(null)

  const frontendUrl = await startFrontendServer(rootDir)
  const iconPath = getAssetPath('app-icon.ico')
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1480,
    minHeight: 860,
    title: APP_TITLE,
    backgroundColor: '#f5f7fb',
    autoHideMenuBar: true,
    icon: iconPath,
    ...(process.platform === 'win32'
      ? {
          titleBarStyle: 'hidden',
          titleBarOverlay: {
            color: TITLEBAR_COLOR,
            symbolColor: TITLEBAR_SYMBOL_COLOR,
            height: TITLEBAR_HEIGHT,
          },
        }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenu(null)
  installDesktopChrome(win)
  installExternalLinkHandling(win)

  if (frontendUrl) {
    await win.loadURL(frontendUrl)
  } else {
    await win.loadURL(pathToFileURL(path.join(rootDir, 'dist', 'index.html')).toString())
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (frontendServer) {
    frontendServer.close()
    frontendServer = null
  }
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
