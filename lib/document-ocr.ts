/**
 * OCR and local text cache for SECNet PDF attachments.
 * Parsed fields go to Supabase; OCR text stays in lib/data/dividend_ocr_cache.json only.
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

const CACHE_PATH = path.join(process.cwd(), 'lib', 'data', 'dividend_ocr_cache.json')

export type OcrCacheEntry = { text: string; cachedAt: string; text_sha256?: string }
export type OcrCache = Record<string, OcrCacheEntry>

export const OCR_ENGINE = 'tesseract-mkd+eng'
export const DEFAULT_OCR_MAX_PAGES = Number(process.env.TALIR_OCR_MAX_PAGES ?? 4)

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
        const viewport = page.getViewport({ scale: 2 })
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

export async function loadCachedText(
    attachmentId: number,
    bufferSha256?: string
): Promise<string | null> {
    const key = String(attachmentId)
    const cached = loadOcrCache()[key]
    if (cached?.text && cached.text.length > 20) {
        if (!bufferSha256 || !cached.text_sha256 || cached.text_sha256 === bufferSha256) {
            return cached.text
        }
    }
    return null
}

export async function persistOcrText(input: {
    attachmentId: number
    text: string
    bufferSha256: string
}): Promise<void> {
    const cache = loadOcrCache()
    cache[String(input.attachmentId)] = {
        text: input.text,
        cachedAt: new Date().toISOString(),
        text_sha256: input.bufferSha256,
    }
    saveOcrCache(cache)
}

/** OCR a scanned PDF attachment; returns concatenated text or null. */
export async function ocrPdfBuffer(
    buffer: Buffer,
    attachmentId: number,
    options?: { maxPages?: number }
): Promise<string | null> {
    const hash = sha256Buffer(buffer)
    const cached = await loadCachedText(attachmentId, hash)
    if (cached && cached.length > 20) return cached

    try {
        const maxPages = options?.maxPages ?? DEFAULT_OCR_MAX_PAGES
        const images = await renderPdfPagesToBuffers(buffer, maxPages)
        if (!images.length) return null

        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('mkd+eng')
        const parts: string[] = []

        for (const image of images) {
            const result = await worker.recognize(image)
            if (result.data.text?.trim()) parts.push(result.data.text.trim())
        }

        await worker.terminate()

        const text = parts.join(' ').replace(/\s+/g, ' ').trim()
        if (text.length > 20) {
            await persistOcrText({ attachmentId, text, bufferSha256: hash })
            return text
        }
        return null
    } catch (err) {
        console.warn(`OCR failed for attachment ${attachmentId}:`, err)
        return null
    }
}
