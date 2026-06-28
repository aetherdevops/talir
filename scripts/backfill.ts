
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.mse.mk/mk/stats/symbolhistory/';
const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'stocks');
const MARKET_SUMMARY_FILE = path.join(process.cwd(), 'public', 'data', 'market_summary.json');

// Helper to parse numbers (1.234,56 -> 1234.56)
function parseNumber(str: string): number {
    if (!str) return 0;
    // Remove thousand separators (.), replace decimal separator (,) with (.)
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Helper to parse date (dd.mm.yyyy -> yyyy-mm-dd)
function parseDate(str: string): string {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function fetchStockHistory(code: string, year: number) {
    // Reverting to unpadded dots as per original Python script (1.1.2024)
    const fromDate = `1.1.${year}`;
    const toDate = `31.12.${year}`;


    try {
        const response = await fetch(`${BASE_URL}${code}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: `FromDate=${fromDate}&ToDate=${toDate}&Code=${code}`
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        const rows = $('table#resultsTable tbody tr');

        const records: any[] = [];

        rows.each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length < 9) return;

            records.push({
                date: parseDate($(cells[0]).text().trim()),
                last_transaction_price: parseNumber($(cells[1]).text().trim()),
                max_price: parseNumber($(cells[2]).text().trim()),
                min_price: parseNumber($(cells[3]).text().trim()),
                average_price: parseNumber($(cells[4]).text().trim()),
                percent_change: parseNumber($(cells[5]).text().trim()),
                quantity: parseNumber($(cells[6]).text().trim()),
                turnover_best_mkd: parseNumber($(cells[7]).text().trim()),
                total_turnover_mkd: parseNumber($(cells[8]).text().trim())
            });
        });

        if (records.length === 0) {
            console.log(`Empty response for ${year}. Title: ${$('title').text().trim()}`);
            // console.log('Body start:', $('body').text().substring(0, 200).replace(/\s+/g, ' '));
        }

        return records;
    } catch (e) {
        console.error(`Error fetching ${code} for ${year}:`, e);
        return [];
    }
}

async function processStock(code: string, name: string) {
    const startYear = 2002;
    const endYear = new Date().getFullYear();
    let allHistory: any[] = [];

    console.log(`Processing ${code}...`);

    for (let year = startYear; year <= endYear; year++) {
        const records = await fetchStockHistory(code, year);
        if (records.length > 0) {
            allHistory.push(...records);
        }
        // mild delay to be polite
        await new Promise(r => setTimeout(r, 50));
    }

    // Deduplicate and sort
    const unique = new Map();
    allHistory.forEach(r => unique.set(r.date, r));
    const sortedHistory = Array.from(unique.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedHistory.length === 0) {
        console.log(`No history found for ${code}`);
        return;
    }

    const data = {
        company_code: code,
        company_name: name,
        history: sortedHistory
    };

    fs.writeFileSync(path.join(DATA_DIR, `${code}.json`), JSON.stringify(data, null, 2));
    console.log(`Saved ${code}: ${sortedHistory.length} records.`);
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Read target tickers from summary
    const summary = JSON.parse(fs.readFileSync(MARKET_SUMMARY_FILE, 'utf-8'));

    // Check for --test flag
    const testMode = process.argv.includes('--test');

    // If test mode, verify specifically on KKB (Komercijalna Banka) or ALK (Alkaloid)
    // But summary order is alphabetical. 11OK is first.
    // Let's filter for KMB if test mode, or just take first 3.
    let targets = summary;
    if (testMode) {
        targets = summary.filter((s: any) => s.code === 'KMB' || s.code === 'ALK');
        if (targets.length === 0) targets = summary.slice(0, 1);
    }

    console.log(`Starting backfill for ${targets.length} symbols (Test Mode: ${testMode})`);

    // Process in chunks to control concurrency
    const CHUNK_SIZE = 5;
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
        const chunk = targets.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map((t: any) => processStock(t.code, t.name)));
    }
}

main().catch(console.error);
