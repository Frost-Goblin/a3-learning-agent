const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const assetsDir = path.join(projectRoot, 'assets')
const faviconPath = path.join(projectRoot, 'public', 'favicon.svg')
const size = 256

fs.mkdirSync(assetsDir, { recursive: true })

function writeSvg() {
  fs.copyFileSync(faviconPath, path.join(assetsDir, 'app-icon.svg'))
}

function pointInPolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) {
      inside = !inside
    }
  }
  return inside
}

function setPixel(pixels, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return
  }
  const offset = (y * size + x) * 4
  pixels[offset] = color[2]
  pixels[offset + 1] = color[1]
  pixels[offset + 2] = color[0]
  pixels[offset + 3] = alpha
}

function blendPixel(pixels, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) {
    return
  }
  const offset = (y * size + x) * 4
  const existingAlpha = pixels[offset + 3] / 255
  const incomingAlpha = alpha / 255
  const outAlpha = incomingAlpha + existingAlpha * (1 - incomingAlpha)
  if (outAlpha <= 0) {
    return
  }

  pixels[offset] = Math.round((color[2] * incomingAlpha + pixels[offset] * existingAlpha * (1 - incomingAlpha)) / outAlpha)
  pixels[offset + 1] = Math.round((color[1] * incomingAlpha + pixels[offset + 1] * existingAlpha * (1 - incomingAlpha)) / outAlpha)
  pixels[offset + 2] = Math.round((color[0] * incomingAlpha + pixels[offset + 2] * existingAlpha * (1 - incomingAlpha)) / outAlpha)
  pixels[offset + 3] = Math.round(outAlpha * 255)
}

function drawSoftShadow(pixels, polygon, shiftX, shiftY, color, alpha) {
  const shifted = polygon.map(([x, y]) => [x + shiftX, y + shiftY])
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const centerHit = pointInPolygon(x + 0.5, y + 0.5, shifted)
      if (centerHit) {
        blendPixel(pixels, x, y, color, alpha)
      }
    }
  }
}

function drawLightning(pixels) {
  // Transparent icon that visually matches the existing Vite-style favicon.
  const bolt = [
    [111, 8],
    [213, 8],
    [161, 83],
    [207, 83],
    [87, 248],
    [104, 142],
    [47, 142],
  ]
  const cut = [
    [95, 46],
    [147, 46],
    [120, 86],
    [146, 86],
    [98, 153],
    [108, 112],
    [75, 112],
  ]

  drawSoftShadow(pixels, bolt, -16, 18, [0x00, 0xc2, 0xff], 110)
  drawSoftShadow(pixels, bolt, 10, 12, [0x89, 0x00, 0xff], 105)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0
      for (const dy of [0.25, 0.75]) {
        for (const dx of [0.25, 0.75]) {
          if (pointInPolygon(x + dx, y + dy, bolt) && !pointInPolygon(x + dx, y + dy, cut)) {
            coverage += 1
          }
        }
      }

      if (coverage > 0) {
        const t = Math.max(0, Math.min(1, y / size))
        const purple = [
          Math.round(0x91 * (1 - t) + 0x89 * t),
          Math.round(0x35 * (1 - t) + 0x00 * t),
          0xff,
        ]
        blendPixel(pixels, x, y, purple, Math.round((coverage / 4) * 255))
      }
    }
  }
}

function writeIco() {
  const pixels = Buffer.alloc(size * size * 4)
  drawLightning(pixels)

  const headerSize = 40
  const xorSize = size * size * 4
  const andStride = Math.ceil(size / 32) * 4
  const andSize = andStride * size
  const imageSize = headerSize + xorSize + andSize
  const icoSize = 6 + 16 + imageSize
  const ico = Buffer.alloc(icoSize)

  let offset = 0
  ico.writeUInt16LE(0, offset)
  offset += 2
  ico.writeUInt16LE(1, offset)
  offset += 2
  ico.writeUInt16LE(1, offset)
  offset += 2

  ico.writeUInt8(0, offset)
  offset += 1
  ico.writeUInt8(0, offset)
  offset += 1
  ico.writeUInt8(0, offset)
  offset += 1
  ico.writeUInt8(0, offset)
  offset += 1
  ico.writeUInt16LE(1, offset)
  offset += 2
  ico.writeUInt16LE(32, offset)
  offset += 2
  ico.writeUInt32LE(imageSize, offset)
  offset += 4
  ico.writeUInt32LE(22, offset)
  offset += 4

  ico.writeUInt32LE(headerSize, offset)
  offset += 4
  ico.writeInt32LE(size, offset)
  offset += 4
  ico.writeInt32LE(size * 2, offset)
  offset += 4
  ico.writeUInt16LE(1, offset)
  offset += 2
  ico.writeUInt16LE(32, offset)
  offset += 2
  ico.writeUInt32LE(0, offset)
  offset += 4
  ico.writeUInt32LE(xorSize, offset)
  offset += 4
  ico.writeInt32LE(0, offset)
  offset += 4
  ico.writeInt32LE(0, offset)
  offset += 4
  ico.writeUInt32LE(0, offset)
  offset += 4
  ico.writeUInt32LE(0, offset)
  offset += 4

  for (let y = size - 1; y >= 0; y -= 1) {
    const rowOffset = y * size * 4
    pixels.copy(ico, offset, rowOffset, rowOffset + size * 4)
    offset += size * 4
  }

  fs.writeFileSync(path.join(assetsDir, 'app-icon.ico'), ico)
}

writeSvg()
writeIco()
console.log(`Generated favicon-based icons in ${assetsDir}`)
