
import * as cheerio from 'cheerio';

async function main() {
    console.log('Fetching MBI10 page...');
    const response = await fetch('https://www.mse.mk/en/indicies/MBI10/values');
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('Buttons/Inputs found:');
    $('button, input[type="submit"], input[type="button"], a.btn').each((i, el) => {
        console.log(`Item ${i}: Tag=${el.tagName}, ID=${$(el).attr('id')}, Class=${$(el).attr('class')}, Text=${$(el).text().trim()}, Value=${$(el).val()}`);
    });
}

main();
