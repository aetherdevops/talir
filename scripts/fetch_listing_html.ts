
import fs from 'fs';
import path from 'path';

async function main() {
    const url = 'https://www.mse.mk/en/issuers/super-listing';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        const html = await res.text();
        console.log(`Fetched ${html.length} bytes.`);
        fs.writeFileSync('listing_dump.html', html);
    } catch (e) {
        console.error(e);
    }
}
main();
