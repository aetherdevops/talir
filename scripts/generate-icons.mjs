/**
 * Generate PWA / OG raster icons from public/favicon.svg (sole mark source).
 *
 * Outputs:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/apple-touch-icon.png
 *   public/og.png
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const ICONS_DIR = path.join(PUBLIC, 'icons')
const FAVICON_SVG = path.join(PUBLIC, 'favicon.svg')

const NAVY = '#0F1F38'
const NAVY_DEEP = '#0A1424'
const IVORY = '#F5F2EA'
const MUTED = '#9FB0C9'

const SERIF_FONT = path.join(
    ROOT,
    'node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2'
)
const MONO_FONT = path.join(
    ROOT,
    'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'
)

function roundedSquareSvg(size, fill, radiusRatio = 0.22) {
    const r = size * radiusRatio
    return Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${fill}"/>
</svg>`
    )
}

async function loadMarkPng(size) {
    return sharp(FAVICON_SVG).resize(size, size, { fit: 'contain' }).png().toBuffer()
}

async function writeRoundedIcon(outPath, canvasSize, markScale = 1) {
    const markSize = Math.round(canvasSize * markScale)
    const offset = Math.round((canvasSize - markSize) / 2)
    const mark = await loadMarkPng(markSize)

    await sharp(roundedSquareSvg(canvasSize, NAVY))
        .composite([{ input: mark, left: offset, top: offset }])
        .png()
        .toFile(outPath)

    console.log(`Wrote ${path.relative(ROOT, outPath)}`)
}

async function renderTextPng({ text, fontfile, width, height, color }) {
    return sharp({
        text: {
            text,
            fontfile,
            font: 'custom',
            width,
            height,
            align: 'left',
            rgba: true,
        },
    })
        .png()
        .toBuffer()
        .then(async (buf) => {
            // Tint glyphs to target colour (sharp text renders black; recolour via raw pipeline)
            const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
            const [r, g, b] = hexToRgb(color)
            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3]
                if (a === 0) continue
                data[i] = r
                data[i + 1] = g
                data[i + 2] = b
            }
            return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
                .png()
                .toBuffer()
        })
}

function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

async function writeOgImage(outPath) {
    const width = 1200
    const height = 630
    const markSize = 200
    const markLeft = 120
    const markTop = Math.round((height - markSize) / 2)
    const textLeft = markLeft + markSize + 48

    const mark = await loadMarkPng(markSize)

    const wordmark = await renderTextPng({
        text: 'Talir.',
        fontfile: SERIF_FONT,
        width: 520,
        height: 96,
        color: IVORY,
    })

    const tagline = await renderTextPng({
        text: 'MAKEDONSKA BERZA · MARKETS',
        fontfile: MONO_FONT,
        width: 640,
        height: 40,
        color: MUTED,
    })

    await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: NAVY_DEEP,
        },
    })
        .composite([
            { input: mark, left: markLeft, top: markTop },
            { input: wordmark, left: textLeft, top: markTop + 36 },
            { input: tagline, left: textLeft, top: markTop + 132 },
        ])
        .png()
        .toFile(outPath)

    console.log(`Wrote ${path.relative(ROOT, outPath)}`)
}

function assertInputs() {
    if (!fs.existsSync(FAVICON_SVG)) {
        throw new Error(`Missing mark source: ${FAVICON_SVG}`)
    }
    if (!fs.existsSync(SERIF_FONT)) {
        throw new Error(`Missing font: ${SERIF_FONT} — run npm install`)
    }
    if (!fs.existsSync(MONO_FONT)) {
        throw new Error(`Missing font: ${MONO_FONT} — run npm install`)
    }
}

async function main() {
    assertInputs()
    fs.mkdirSync(ICONS_DIR, { recursive: true })

    await writeRoundedIcon(path.join(ICONS_DIR, 'icon-192.png'), 192, 1)
    await writeRoundedIcon(path.join(ICONS_DIR, 'icon-512.png'), 512, 1)
    await writeRoundedIcon(path.join(PUBLIC, 'apple-touch-icon.png'), 180, 0.6)
    await writeOgImage(path.join(PUBLIC, 'og.png'))
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
