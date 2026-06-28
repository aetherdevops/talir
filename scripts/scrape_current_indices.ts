
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const INDICES = [
    { code: 'MBI10', url: 'https://www.mse.mk/en/indicies/MBI10/values' },
    { code: 'OMB', url: 'https://www.mse.mk/en/indicies/OMB/values' }
];

const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'indices');

async function scrapeCurrentValue(indexCode: string, url: string) {
    console.log(`Scraping current ${indexCode}...`);
    const outputFile = path.join(DATA_DIR, `${indexCode}.json`);

    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Try to find the "Current" table
        // Usually it's a small table with "Double" class or similar, or just look for the text
        let value = 0;
        let change = 0;
        let found = false;

        // Strategy 1: Look for "Current" label row
        $('td').each((i, el) => {
            if ($(el).text().trim() === 'Current') {
                // Next row or cell?
                // Structure might be: <tr><td>Current</td><td>6,420.50</td>...</tr>
                const parent = $(el).parent();
                const cells = parent.find('td');
                if (cells.length > 1) {
                    const valText = $(cells[1]).text().trim();
                    const changeText = $(cells[2]).text().trim(); // Maybe?

                    value = parseFloat(valText.replace(/\./g, '').replace(',', '.'));
                    // Change might be in % or absolute
                    if (changeText) {
                        // Check if it has %
                        // Let's just take value first
                    }
                    if (!isNaN(value)) found = true;
                }
            }
        });

        // Strategy 3: Target Table 1 explicitly (from inspect results)
        const tables = $('table');
        console.log(`Tables found: ${tables.length}`);

        if (tables.length > 1) {
            const t = $(tables[1]);
            // Based on logs:
            // Row 0: Current
            // Row 1: Value 10,190.89
            // Row 2: Change % -0.32

            const rows = t.find('tr');
            if (rows.length >= 2) {
                // Value
                const valRow = $(rows[1]);
                const valText = valRow.find('td').eq(1).text().trim();
                console.log(`Extracting value from: ${valText}`);
                value = parseFloat(valText.replace(/\./g, '').replace(',', '.'));

                // Change %
                if (rows.length > 2) {
                    const changeRow = $(rows[2]);
                    const changeText = changeRow.find('td').eq(1).text().trim(); // "-0.32"
                    // console.log(`Change text: ${changeText}`);
                    // Parsing change not strictly needed for just 'value' verification but good to have
                }

                if (!isNaN(value)) found = true;
            }
        }

        // Strategy 2: Look for the big number on the page (if logic 1 fails)
        if (!found) {
            // MSE Home page tickers?
            // Let's assume strategy 1 works for now as inspect_indices saw "Current"
        }

        if (found) {
            console.log(`Found value: ${value}`);
            const today = new Date().toISOString().split('T')[0];
            const data = [{
                date: today,
                value: value,
                change: 0 // We might miss change but value is key
            }];

            // To make change calculation work in lib/data.ts, we need 2 points.
            // Let's fake a previous point? No, just 1 point is honest.

            fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
            console.log(`Saved current value to ${outputFile}`);
        } else {
            console.error(`Could not find current value for ${indexCode}`);
            // Fallback: don't overwrite if existing? But existing is []
        }

    } catch (e) {
        console.error(`Error scraping ${indexCode}:`, e);
    }
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    for (const index of INDICES) {
        await scrapeCurrentValue(index.code, index.url);
    }
}

main().catch(console.error);
