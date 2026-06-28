
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.mse.mk/mk/stats/symbolhistory/';
const DATA_DIR = path.join(process.cwd(), 'lib', 'data', 'stocks');

// Reusing helper functions (in a real app, extract to utils)
function parseNumber(str: string): number {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function parseDate(str: string): string {
    const [d, m, y] = str.split('.');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function fetchRange(code: string, fromDate: Date, toDate: Date) {
    // Format: d.M.yyyy (unpadded dots for MK endpoint)
    const from = `${fromDate.getDate()}.${fromDate.getMonth() + 1}.${fromDate.getFullYear()}`;
    const to = `${toDate.getDate()}.${toDate.getMonth() + 1}.${toDate.getFullYear()}`;

    try {
        const response = await fetch(`${BASE_URL}${code}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: `FromDate=${from}&ToDate=${to}&Code=${code}`
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
        return records;
    } catch (e) {
        console.error(`Error fetching update for ${code}:`, e);
        return [];
    }
}

async function updateStock(file: string) {
    const filePath = path.join(DATA_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const history = content.history || [];
    if (history.length === 0) return; // Should have data from backfill

    // Sort to be sure we get the last date
    history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastDate = new Date(history[history.length - 1].date);
    const today = new Date();

    // Check if update needed (today > lastDate)
    const lastYMD = lastDate.toISOString().split('T')[0];
    const todayYMD = today.toISOString().split('T')[0];

    if (lastYMD === todayYMD) {
        return; // Already up to date
    }

    const nextDay = new Date(lastDate);
    nextDay.setDate(nextDay.getDate() + 1);

    if (nextDay > today) return;

    console.log(`Updating ${content.company_code} from ${nextDay.toISOString().split('T')[0]}...`);

    const newRecords = await fetchRange(content.company_code, nextDay, today);

    if (newRecords.length > 0) {
        // Add new records
        history.push(...newRecords);
        // Resort and Save
        history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        content.history = history;
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log(`  -> Added ${newRecords.length} records.`);
    } else {
        console.log(`  -> No new trades found.`);
    }
}

async function main() {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    console.log(`Checking ${files.length} stocks for updates...`);

    const CHUNK_SIZE = 10;
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const chunk = files.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(updateStock));
    }

    // Also run index scraper
    console.log('Updating indices...');
    const { exec } = await import('child_process');
    exec('npx tsx scripts/scrape_indices.ts', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error updating indices: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Indices stderr: ${stderr}`);
        }
        console.log(`Indices stdout: ${stdout}`);
    });
}

main().catch(console.error);
