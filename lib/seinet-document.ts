/**
 * Fetch SEInet document metadata, resolve EN→MK originals, and extract attachment text.
 */
import * as cheerio from 'cheerio'
import { PDFParse } from 'pdf-parse'
import { loadOcrCache, ocrPdfBuffer, type OcrCache } from './dividend-ocr'

const SEINET_API = 'https://api.seinet.com.mk/public/documents'
export const DIVIDEND_CALENDAR_LAYOUT_CODE = 'DOC_10688'
export const AUDITED_FINANCIAL_LAYOUT_CODE = 'DOC_10682'

export interface SeinetAttachment {
    attachmentId: number
    fileName: string
    mimeType: string | null
}

export interface SeinetLayoutLink {
    previousId: number | null
    nextId: number | null
}

export interface SeinetCalendarMeta {
    documentId: number
    issuerId: number
    stockCode: string
    stockName: string
    filedAt: string
    url: string
    layoutCode: string
    layoutLink: SeinetLayoutLink
}

export interface SeinetFundamentalMeta {
    documentId: number
    issuerId: number
    stockCode: string
    stockName: string
    filedAt: string
    url: string
    layoutCode: string
    layoutLink: SeinetLayoutLink
}

export interface SeinetDocument {
    documentId: number
    contentHtml: string | null
    attachments: SeinetAttachment[]
}

export type DividendTextSource = 'pdf_text' | 'html' | 'ocr'

export interface DividendDocumentText {
    text: string
    source: DividendTextSource
}

interface RawSeinetDocument {
    documentId: number
    issuerId?: number
    content?: string | null
    publishedDate?: string | null
    layout?: { layoutCode?: string | null } | null
    layoutLink?: {
        previousId?: number | null
        nextId?: number | null
    } | null
    issuer?: {
        issuerId?: number
        code?: string | null
        localizedTerms?: Array<{ displayName?: string | null; languageId?: number }>
    } | null
    attachments?: Array<{
        attachmentId: number
        fileName?: string
        attachmentType?: { mimeType?: string }
    }>
}

function mapDocument(raw: RawSeinetDocument): SeinetDocument {
    return {
        documentId: raw.documentId,
        contentHtml: raw.content ?? null,
        attachments: (raw.attachments ?? []).map((att) => ({
            attachmentId: att.attachmentId,
            fileName: att.fileName ?? '',
            mimeType: att.attachmentType?.mimeType ?? null,
        })),
    }
}

function mapLayoutLink(raw: RawSeinetDocument['layoutLink']): SeinetLayoutLink {
    return {
        previousId: raw?.previousId ?? null,
        nextId: raw?.nextId ?? null,
    }
}

function issuerDisplayName(raw: RawSeinetDocument): string {
    const terms = raw.issuer?.localizedTerms ?? []
    const english = terms.find((term) => term.languageId === 2)
    return english?.displayName ?? terms[0]?.displayName ?? raw.issuer?.code ?? 'Unknown'
}

function publishedDateToIso(raw: RawSeinetDocument): string | null {
    if (!raw.publishedDate) return null
    const date = raw.publishedDate.split('T')[0]
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

export function buildSeinetDocumentUrl(documentId: number, locale: 'en' | 'mk' = 'en'): string {
    return `https://seinet.com.mk/${locale}/document/${documentId}`
}

export function parseDocumentIdFromUrl(url: string): number | null {
    const match = url.match(/document\/(\d+)/i)
    if (!match) return null
    const id = Number(match[1])
    return Number.isFinite(id) ? id : null
}

function parseLinkedDocumentId(html: string | null | undefined): number | null {
    if (!html) return null
    const match = html.match(/document\/(\d+)/i)
    if (!match) return null
    const id = Number(match[1])
    return Number.isFinite(id) ? id : null
}

export async function fetchSeinetDocumentRaw(documentId: number): Promise<RawSeinetDocument | null> {
    try {
        const res = await fetch(`${SEINET_API}/single/${documentId}`, {
            headers: { Accept: 'application/json' },
        })
        if (!res.ok) return null
        const json = (await res.json()) as { isSuccess?: boolean; data?: RawSeinetDocument }
        if (!json.isSuccess || !json.data) return null
        return json.data
    } catch {
        return null
    }
}

export async function fetchSeinetDocument(documentId: number): Promise<SeinetDocument | null> {
    const raw = await fetchSeinetDocumentRaw(documentId)
    if (!raw) return null
    return mapDocument(raw)
}

export function mapRawToCalendarMeta(raw: RawSeinetDocument): SeinetCalendarMeta | null {
    const layoutCode = raw.layout?.layoutCode ?? ''
    if (layoutCode !== DIVIDEND_CALENDAR_LAYOUT_CODE) return null

    const stockCode = raw.issuer?.code?.trim()
    const filedAt = publishedDateToIso(raw)
    if (!stockCode || !filedAt) return null

    return {
        documentId: raw.documentId,
        issuerId: raw.issuerId ?? raw.issuer?.issuerId ?? 0,
        stockCode,
        stockName: issuerDisplayName(raw),
        filedAt,
        url: buildSeinetDocumentUrl(raw.documentId),
        layoutCode,
        layoutLink: mapLayoutLink(raw.layoutLink),
    }
}

export function mapRawToFundamentalMeta(raw: RawSeinetDocument): SeinetFundamentalMeta | null {
    const layoutCode = raw.layout?.layoutCode ?? ''
    if (layoutCode !== AUDITED_FINANCIAL_LAYOUT_CODE) return null

    const stockCode = raw.issuer?.code?.trim()
    const filedAt = publishedDateToIso(raw)
    if (!stockCode || !filedAt) return null

    return {
        documentId: raw.documentId,
        issuerId: raw.issuerId ?? raw.issuer?.issuerId ?? 0,
        stockCode,
        stockName: issuerDisplayName(raw),
        filedAt,
        url: buildSeinetDocumentUrl(raw.documentId),
        layoutCode,
        layoutLink: mapLayoutLink(raw.layoutLink),
    }
}

async function walkLayoutLinkChain<T extends { documentId: number }>(
    startDocumentId: number,
    mapMeta: (raw: RawSeinetDocument) => T | null
): Promise<T[]> {
    const seen = new Set<number>()
    const metas = new Map<number, T>()

    async function walk(documentId: number | null | undefined): Promise<void> {
        while (documentId && !seen.has(documentId)) {
            seen.add(documentId)
            const raw = await fetchSeinetDocumentRaw(documentId)
            if (!raw) break

            const meta = mapMeta(raw)
            if (meta) metas.set(meta.documentId, meta)

            documentId = raw.layoutLink?.previousId ?? null
        }
    }

    async function walkNext(documentId: number | null | undefined): Promise<void> {
        while (documentId && !seen.has(documentId)) {
            seen.add(documentId)
            const raw = await fetchSeinetDocumentRaw(documentId)
            if (!raw) break

            const meta = mapMeta(raw)
            if (meta) metas.set(meta.documentId, meta)

            documentId = raw.layoutLink?.nextId ?? null
        }
    }

    const startRaw = await fetchSeinetDocumentRaw(startDocumentId)
    if (!startRaw) return []

    const startMeta = mapMeta(startRaw)
    if (startMeta) metas.set(startMeta.documentId, startMeta)

    await walk(startRaw.layoutLink?.previousId ?? null)
    await walkNext(startRaw.layoutLink?.nextId ?? null)

    return Array.from(metas.values())
}

/**
 * Walk the global DOC_10688 layoutLink chain (market-wide, not per issuer).
 * Returns all dividend calendar documents in the chain.
 */
export async function walkDividendCalendarChain(startDocumentId: number): Promise<SeinetCalendarMeta[]> {
    return walkLayoutLinkChain(startDocumentId, mapRawToCalendarMeta)
}

/**
 * Walk the global DOC_10682 layoutLink chain for audited annual financial statements.
 */
export async function walkAuditedFinancialChain(startDocumentId: number): Promise<SeinetFundamentalMeta[]> {
    return walkLayoutLinkChain(startDocumentId, mapRawToFundamentalMeta)
}

/** Follow auto-generated EN wrappers to the MK original when attachments are absent. */
export async function resolveSourceDocument(documentId: number): Promise<SeinetDocument | null> {
    const doc = await fetchSeinetDocument(documentId)
    if (!doc) return null

    if (doc.attachments.length > 0) return doc

    const linkedId = parseLinkedDocumentId(doc.contentHtml)
    if (!linkedId || linkedId === documentId) return doc

    const original = await fetchSeinetDocument(linkedId)
    return original ?? doc
}

function htmlToPlainText(html: string): string {
    const $ = cheerio.load(html)
    $('script, style').remove()
    return $.text().replace(/\s+/g, ' ').trim()
}

async function downloadAttachmentBuffer(attachmentId: number): Promise<Buffer | null> {
    try {
        const res = await fetch(`${SEINET_API}/attachment/${attachmentId}`)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
    } catch {
        return null
    }
}

async function extractPdfText(buffer: Buffer): Promise<string | null> {
    try {
        const parser = new PDFParse({ data: buffer })
        const result = await parser.getText()
        await parser.destroy()
        const text = result.text.replace(/\s+/g, ' ').trim()
        return text.length > 20 ? text : null
    } catch {
        return null
    }
}

function isPdfAttachment(att: SeinetAttachment): boolean {
    return /\.pdf$/i.test(att.fileName) || att.mimeType === 'application/pdf'
}

/**
 * Extract parseable text from a dividend calendar document: PDF attachments first,
 * then substantive HTML content (excluding auto-generated link-only wrappers).
 * Optional OCR when TALIR_OCR_DIVIDENDS=1 and PDF text layer is empty.
 */
export async function fetchDividendDocumentText(
    documentUrl: string,
    options?: { allowOcr?: boolean; ocrCache?: OcrCache; persistOcrCache?: boolean }
): Promise<DividendDocumentText | null> {
    const documentId = parseDocumentIdFromUrl(documentUrl)
    if (!documentId) return null

    const allowOcr = options?.allowOcr ?? process.env.TALIR_OCR_DIVIDENDS === '1'
    const ocrCache = options?.ocrCache ?? (allowOcr ? loadOcrCache() : {})

    const doc = await resolveSourceDocument(documentId)
    if (!doc) return null

    const pdfAttachments = doc.attachments.filter(isPdfAttachment)
    const otherAttachments = doc.attachments.filter((att) => !isPdfAttachment(att))

    for (const att of [...pdfAttachments, ...otherAttachments]) {
        const buffer = await downloadAttachmentBuffer(att.attachmentId)
        if (!buffer) continue

        if (isPdfAttachment(att)) {
            const pdfText = await extractPdfText(buffer)
            if (pdfText) return { text: pdfText, source: 'pdf_text' }

            if (allowOcr) {
                const ocrText = await ocrPdfBuffer(buffer, att.attachmentId, ocrCache)
                if (ocrText) {
                    return { text: ocrText, source: 'ocr' }
                }
            }
            continue
        }

        const htmlText = htmlToPlainText(buffer.toString('utf8'))
        if (htmlText.length > 40) return { text: htmlText, source: 'html' }
    }

    if (doc.contentHtml) {
        const plain = htmlToPlainText(doc.contentHtml)
        const isAutoWrapper = /automaticaly generated document|автоматски/i.test(plain)
        if (!isAutoWrapper && plain.length > 40) return { text: plain, source: 'html' }
    }

    return null
}
