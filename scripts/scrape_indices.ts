
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const INDICES = [
    { code: 'MBI10', url: 'https://www.mse.mk/en/indicies/MBI10/values' },
    { code: 'OMB', url: 'https://www.mse.mk/en/indicies/OMB/values' }
];

const DATA_DIR = path.join(process.cwd(), 'lib', 'data', 'indices');

async function scrapeIndex(indexCode: string, url: string) {
    console.log(`Starting available scrape for ${indexCode} at ${url}...`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const allHistory: any[] = [];

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // 1. Get Years from #cmbYear (verified via debug)
        await page.waitForSelector('#cmbYear');
        const years = await page.$$eval('#cmbYear option', options =>
            options.map(opt => (opt as HTMLOptionElement).value).filter(v => v)
        );

        console.log(`Found years for ${indexCode}: ${years.join(', ')}`);

        // 1.5 Load existing data to find latest date
        const existingFile = path.join(DATA_DIR, `${indexCode}.json`);
        let latestYear = 0;

        if (fs.existsSync(existingFile)) {
            try {
                const existingData = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
                if (Array.isArray(existingData) && existingData.length > 0) {
                    allHistory.push(...existingData);
                    // Find max date
                    const dates = existingData.map(d => new Date(d.date).getFullYear());
                    latestYear = Math.max(...dates);
                    console.log(`Found existing data up to year ${latestYear}`);
                }
            } catch (e) {
                console.error(`Error reading existing ${indexCode} data`, e);
            }
        }

        // 2. Iterate Years
        for (const year of years) {
            const yearNum = parseInt(year);
            if (!isNaN(yearNum) && yearNum < latestYear) {
                // console.log(`Skipping ${year} (already have data)`);
                continue;
            }

            console.log(`Scraping ${indexCode} for year: ${year}...`);

            await page.select('#cmbYear', year);

            // Wait for update - user suggested 2s
            await new Promise(r => setTimeout(r, 2000));

            try {
                // Wait for the specific results table. 
                // Based on debug logs "Tables found: 3", it's likely one of them.
                // We'll search for the one with "Date" and "Value" headers again to be robust.

                const yearData = await page.evaluate(() => {
                    const results: any[] = [];
                    const tables = Array.from(document.querySelectorAll('table'));
                    let targetTable: HTMLTableElement | null = null;

                    // Logic to find the right table: contains "Date" and "Value"
                    for (const t of tables) {
                        // Check header
                        const txt = t.innerText.toLowerCase();
                        if (txt.includes('date') && (txt.includes('value') || txt.includes('last'))) {
                            targetTable = t;
                            break;
                        }
                    }

                    if (!targetTable) return [];

                    const rows = Array.from(targetTable.querySelectorAll('tbody tr'));
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const dateText = cells[0].innerText.trim();
                            const valueText = cells[1].innerText.trim();
                            const changePctText = cells[2]?.innerText?.trim() || '0';

                            // Parse Date
                            let isoDate = '';
                            if (dateText.includes('.')) {
                                const parts = dateText.split('.'); // dd.MM.yyyy
                                if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            } else if (dateText.includes('/')) {
                                const parts = dateText.split('/');
                                if (parts.length === 3) isoDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                            }

                            // Parse Value
                            // MSE English typically 1,234.56
                            let value = parseFloat(valueText.replace(/,/g, ''));
                            let changePct = parseFloat(changePctText.replace(/,/g, '').replace('%', ''));

                            if (isoDate && !isNaN(value)) {
                                results.push({
                                    date: isoDate,
                                    value: value,
                                    change: isNaN(changePct) ? 0 : changePct
                                });
                            }
                        }
                    });
                    return results;
                });

                console.log(` - Found ${yearData.length} records in ${year}`);
                allHistory.push(...yearData);

            } catch (e) {
                console.warn(`No data table found for year ${year}`);
            }
        }

        // 3. Save
        const uniqueHistory = Array.from(new Map(allHistory.map(item => [item.date, item])).values());
        uniqueHistory.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        console.log(`Total records for ${indexCode}: ${uniqueHistory.length}`);

        if (uniqueHistory.length > 0) {
            const outputFile = path.join(DATA_DIR, `${indexCode}.json`);
            fs.writeFileSync(outputFile, JSON.stringify(uniqueHistory, null, 2));
            console.log(`Saved to ${outputFile}`);
        }

    } catch (e) {
        console.error(`Error scraping ${indexCode}:`, e);
    } finally {
        await browser.close();
    }
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
