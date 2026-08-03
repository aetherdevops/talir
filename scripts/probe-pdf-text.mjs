import { PDFParse } from 'pdf-parse'

const attachmentId = process.argv[2] || '83787'
const url = `https://api.seinet.com.mk/public/documents/attachment/${attachmentId}`

const res = await fetch(url)
const buf = Buffer.from(await res.arrayBuffer())
const parser = new PDFParse({ data: buf })
const parsed = await parser.getText()
await parser.destroy()
console.log('pages:', parsed.total)
console.log('text length:', parsed.text.length)
console.log('---TEXT---')
console.log(parsed.text.slice(0, 4000))
