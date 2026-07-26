/**
 * OCR and local text cache for SECNet PDF attachments.
 * Parsed fields go to Supabase; OCR text stays in lib/data/dividend_ocr_cache.json only.
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const CACHE_PATH = path.join(process.cwd(), 'lib', 'data', 'dividend_ocr_cache.json')
const DEFAULT_RENDER_SCALE = 3.0

export type DividendTextCacheSource = 'pdf_text' | 'ocr' | 'html'

export type OcrCacheEntry = {
    text: string
    cachedAt: string
    text_sha256?: string
    /** Origin of cached text — legacy entries without source are treated as ocr. */
    source?: DividendTextCacheSource
}

export type OcrCache = Record<string, OcrCacheEntry>

export const OCR_ENGINE = 'tesseract-mkd+eng'
export const DEFAULT_OCR_MAX_PAGES = Number(process.env.TALIR_OCR_MAX_PAGES ?? 8)

export function sha256Buffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
}

export function loadOcrCache(): OcrCache {
    if (!fs.existsSync(CACHE_PATH)) return {}
    try {
        return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as OcrCache
    } catch {
        return {}
    }
}

export function saveOcrCache(cache: OcrCache): void {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

/** Prefer repo-root traineddata when present so MK OCR does not depend on CDN downloads. */
function resolveOcrLangPath(): string | undefined {
    const root = process.cwd()
    const mkd = path.join(root, 'mkd.traineddata')
    const eng = path.join(root, 'eng.traineddata')
    if (fs.existsSync(mkd) && fs.existsSync(eng)) return root
    return undefined
}

/** Only TALIR_OCR_FORCE busts OCR cache — PARSE_FORCE reuses cached text. */
function shouldBustOcrCache(): boolean {
    return process.env.TALIR_OCR_FORCE === '1'
}

async function renderPdfPagesToBuffers(buffer: Buffer, maxPages = DEFAULT_OCR_MAX_PAGES): Promise<Buffer[]> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('@napi-rs/canvas')
    const pathMod = await import('path')
    const { pathToFileURL } = await import('url')

    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        pathMod.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
    ).href

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true })
    const pdf = await loadingTask.promise
    const pageCount = Math.min(pdf.numPages, maxPages)
    const images: Buffer[] = []

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: DEFAULT_RENDER_SCALE })
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')

        await page.render({
            canvas: canvas as unknown as HTMLCanvasElement,
            canvasContext: context as unknown as CanvasRenderingContext2D,
            viewport,
        }).promise

        images.push(canvas.toBuffer('image/png'))
    }

    return images
}

export async function loadCachedEntry(
    attachmentId: number,
    bufferSha256?: string
): Promise<OcrCacheEntry | null> {
    if (shouldBustOcrCache()) return null
    const key = String(attachmentId)
    const cached = loadOcrCache()[key]
    if (cached?.text && cached.text.length > 20) {
        if (!bufferSha256 || !cached.text_sha256 || cached.text_sha256 === bufferSha256) {
            return cached
        }
    }
    return null
}

export async function loadCachedText(
    attachmentId: number,
    bufferSha256?: string
): Promise<string | null> {
    const entry = await loadCachedEntry(attachmentId, bufferSha256)
    return entry?.text ?? null
}

export async function persistCachedText(input: {
    attachmentId: number
    text: string
    bufferSha256: string
    source: DividendTextCacheSource
}): Promise<void> {
    const cache = loadOcrCache()
    cache[String(input.attachmentId)] = {
        text: input.text,
        cachedAt: new Date().toISOString(),
        text_sha256: input.bufferSha256,
        source: input.source,
    }
    saveOcrCache(cache)
}

/** @deprecated Use persistCachedText with source. */
export async function persistOcrText(input: {
    attachmentId: number
    text: string
    bufferSha256: string
}): Promise<void> {
    await persistCachedText({ ...input, source: 'ocr' })
}

/** OCR a scanned PDF attachment; returns concatenated text or null. */
export async function ocrPdfBuffer(
    buffer: Buffer,
    attachmentId: number,
    options?: { maxPages?: number }
): Promise<string | null> {
    const hash = sha256Buffer(buffer)
    const cached = await loadCachedEntry(attachmentId, hash)
    if (cached?.text && cached.text.length > 20 && (cached.source ?? 'ocr') === 'ocr') {
        return cached.text
    }

    try {
        const maxPages = options?.maxPages ?? DEFAULT_OCR_MAX_PAGES
        const images = await renderPdfPagesToBuffers(buffer, maxPages)
        if (!images.length) return null

        const { createWorker } = await import('tesseract.js')
        const langPath = resolveOcrLangPath()
        const worker = langPath
            ? await createWorker('mkd+eng', undefined, { langPath })
            : await createWorker('mkd+eng')
        const parts: string[] = []

        for (const image of images) {
            const result = await worker.recognize(image)
            if (result.data.text?.trim()) parts.push(result.data.text.trim())
        }

        await worker.terminate()

        const text = parts.join(' ').replace(/\s+/g, ' ').trim()
        if (text.length > 20) {
            await persistCachedText({
                attachmentId,
                text,
                bufferSha256: hash,
                source: 'ocr',
            })
            return text
        }
        return null
    } catch (err) {
        console.warn(`OCR failed for attachment ${attachmentId}:`, err)
        return null
    }
}

/** Keep only attachment IDs still referenced by current docs (OCR cache rotation). */
export function trimOcrCacheToAttachmentIds(keepIds: Iterable<number | string>): number {
    const keep = new Set([...keepIds].map(String))
    const cache = loadOcrCache()
    let removed = 0
    for (const key of Object.keys(cache)) {
        if (!keep.has(key)) {
            delete cache[key]
            removed++
        }
    }
    if (removed > 0) saveOcrCache(cache)
    return removed
}
