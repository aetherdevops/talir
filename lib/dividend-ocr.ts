/**
 * Optional OCR for scanned dividend calendar PDFs (scripts / prebuild only).
 * Gated by TALIR_OCR_DIVIDENDS=1; results cached by attachmentId.
 */
import fs from 'fs'
import path from 'path'

const CACHE_PATH = path.join(process.cwd(), 'lib', 'data', 'dividend_ocr_cache.json')

export type OcrCacheEntry = { text: string; cachedAt: string }
export type OcrCache = Record<string, OcrCacheEntry>

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

async function renderPdfPagesToBuffers(buffer: Buffer, maxPages = 2): Promise<Buffer[]> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('@napi-rs/canvas')
    const path = await import('path')
    const { pathToFileURL } = await import('url')

    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
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

/** OCR a scanned PDF attachment; returns concatenated text or null. */
export async function ocrPdfBuffer(
    buffer: Buffer,
    attachmentId: number,
    cache: OcrCache
): Promise<string | null> {
    const key = String(attachmentId)
    const cached = cache[key]
    if (cached?.text && cached.text.length > 20) return cached.text

    try {
        const images = await renderPdfPagesToBuffers(buffer)
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
            cache[key] = { text, cachedAt: new Date().toISOString() }
            return text
        }
        return null
    } catch (err) {
        console.warn(`OCR failed for attachment ${attachmentId}:`, err)
        return null
    }
}
