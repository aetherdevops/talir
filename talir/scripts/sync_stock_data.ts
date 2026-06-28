
import fs from 'fs';
import path from 'path';

const STOCKS_DIR = path.join(process.cwd(), 'public', 'data', 'stocks');
const SUMMARY_FILE = path.join(process.cwd(), 'public', 'data', 'market_summary.json');
const ISSUERS_FILE = path.join(process.cwd(), 'public', 'data', 'issuers.json');

async function main() {
    console.log('Starting stock data sync...');

    if (!fs.existsSync(STOCKS_DIR)) {
        console.error('Stocks directory not found!');
        return;
    }

    const files = fs.readdirSync(STOCKS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} stock files.`);

    const summaryData: any[] = [];
    const issuersMap = new Map<string, string>(); // code -> name

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(STOCKS_DIR, file), 'utf-8');
            const stock = JSON.parse(content);

            if (!stock.company_code) continue;

            const name = stock.company_name || '';
            const code = stock.company_code;
            issuersMap.set(code, name);

            // Get latest data
            let price = 0;
            let change_pct = 0;
            let volume = 0;
            let turnover = 0;
            let date = '';

            if (stock.history && Array.isArray(stock.history) && stock.history.length > 0) {
                // Sort by date just in case
                const sortedHistory = stock.history.sort((a: any, b: any) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );

                const latest = sortedHistory[sortedHistory.length - 1];
                const prev = sortedHistory.length > 1 ? sortedHistory[sortedHistory.length - 2] : null;

                price = latest.last_transaction_price || latest.average_price || 0;
                volume = latest.quantity || 0;
                turnover = latest.total_turnover_mkd || 0;
                date = latest.date;

                // Calculate change if not provided or valid
                if (latest.percent_change !== undefined && latest.percent_change !== null) {
                    change_pct = latest.percent_change;
                } else if (prev && prev.last_transaction_price > 0) {
                    change_pct = ((price - prev.last_transaction_price) / prev.last_transaction_price) * 100;
                }
            }

            summaryData.push({
                code,
                name,
                price,
                change_pct,
                volume,
                turnover,
                date
            });

        } catch (e) {
            console.error(`Error processing ${file}:`, e);
        }
    }

    // Sort summary by code
    summaryData.sort((a, b) => a.code.localeCompare(b.code));

    // 1. Update market_summary.json
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summaryData, null, 2));
    console.log(`Updated market_summary.json with ${summaryData.length} records.`);

    // 2. Update issuers.json names
    if (fs.existsSync(ISSUERS_FILE)) {
        const issuersContent = fs.readFileSync(ISSUERS_FILE, 'utf-8');
        const issuers = JSON.parse(issuersContent);
        let updatedCount = 0;

        const updatedIssuers = issuers.map((issuer: any) => {
            if (issuersMap.has(issuer.code)) {
                const newName = issuersMap.get(issuer.code);
                if (newName && issuer.name !== newName) {
                    // console.log(`Updating name for ${issuer.code}: ${issuer.name} -> ${newName}`);
                    issuer.name = newName;
                    updatedCount++;
                }
            }
            return issuer;
        });

        fs.writeFileSync(ISSUERS_FILE, JSON.stringify(updatedIssuers, null, 2));
        console.log(`Updated names for ${updatedCount} issuers in issuers.json.`);
    } else {
        console.warn('issuers.json not found, skipping update.');
    }

    console.log('Sync complete.');
}

main();
