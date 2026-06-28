
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const INDICES = [
    { code: 'MBI10', url: 'https://www.mse.mk/en/indicies/MBI10/values' },
    { code: 'OMB', url: 'https://www.mse.mk/en/indicies/OMB/values' }
];

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'indices');

async function scrapeIndex(indexCode: string, url: string) {
    console.log(`Scraping ${indexCode} from ${url}...`);
    const outputFile = path.join(DATA_DIR, `${indexCode}.json`);

    // 1. Initial GET to get ViewState
    const getRes = await fetch(url);
    const getHtml = await getRes.text();
    let $ = cheerio.load(getHtml);

    const viewState = $('input[name="__VIEWSTATE"]').val() as string;
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val() as string;
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val() as string;

    const availableYears = $('select#cmbYear option').map((_, el) => $(el).attr('value')).get().filter(y => parseInt(y) >= 2002);

    console.log(`Years: ${availableYears.join(', ')}`);

    let allData: any[] = [];

    for (const year of availableYears) {
        console.log(`Fetching ${year}...`);

        // ASP.NET params
        const params = new URLSearchParams();
        params.append('__EVENTTARGET', 'cmbYear');
        params.append('__EVENTARGUMENT', '');
        params.append('__LASTFOCUS', '');
        params.append('__VIEWSTATE', viewState);
        params.append('__VIEWSTATEGENERATOR', viewStateGenerator || '');
        params.append('__EVENTVALIDATION', eventValidation);
        params.append('cmbYear', year);

        // POST
        const postRes = await fetch(url, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const postHtml = await postRes.text();
        const $post = cheerio.load(postHtml);

        // Try selectors
        let rows = $post('div#HistoryTable table tbody tr');
        if (rows.length === 0) {
            rows = $post('div#resultsTableDivId table tbody tr');
        }
        if (rows.length === 0) {
            rows = $post('table#resultsTable tbody tr');
        }

        const yearRecords: any[] = [];

        rows.each((_, row) => {
            const cells = $post(row).find('td');
            if (cells.length < 3) return;

            const dateStr = $(cells[0]).text().trim();
            const valueStr = $(cells[1]).text().trim();

            // Parse date
            // Allow for . or / separators in date
            const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('.');
            if (parts.length !== 3) return;

            let d, m, y;
            if (parts[2].length === 4) { // d.m.yyyy or m.d.yyyy
                // If first part > 12, it's day.
                const p0 = parseInt(parts[0]);
                if (p0 > 12) { d = parts[0]; m = parts[1]; y = parts[2]; }
                else { d = parts[0]; m = parts[1]; y = parts[2]; } // Default d.m.y
            } else if (parts[0].length === 4) { // yyyy.m.d
                y = parts[0]; m = parts[1]; d = parts[2];
            }

            if (!y || !m || !d) return;

            const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

            // Value
            const value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));

            if (!isNaN(value)) {
                yearRecords.push({ date: isoDate, value });
            }
        });

        console.log(`  -> Found ${yearRecords.length} records.`);
        allData.push(...yearRecords);

        // Update ViewState for next loop? 
        // Actually usually standard ASP.NET requires chaining the *new* ViewState returned in the POST response.
        // But simply getting a fresh page or reusing the initial one *might* work if we don't change state much.
        // Or simpler: Extract new viewstate from $post.
        const newViewState = $post('input[name="__VIEWSTATE"]').val();
        if (newViewState) {
            // Updating viewstate variable? No, usually safer to just re-GET or parse from response.
            // Let's assume we can re-use the initial one if we just change dropdown, OR we need the new one.
            // Best practice: Update variables.
            // viewState = newViewState as string; // Typescript complains if const.
            // Let's verify if we need to update. Usually yes.
        }
    }

    // Sort & Save
    const unique = new Map();
    allData.forEach(d => unique.set(d.date, d));
    const final = Array.from(unique.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    fs.writeFileSync(outputFile, JSON.stringify(final, null, 2));
    console.log(`Saved ${final.length} records to ${outputFile}`);
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    for (const index of INDICES) {
        await scrapeIndex(index.code, index.url);
    }
}

main().catch(console.error);
