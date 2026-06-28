
import * as cheerio from 'cheerio';

async function main() {
    console.log('Fetching MBI10 page...');
    const response = await fetch('https://www.mse.mk/en/indicies/MBI10/values');
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('Title:', $('title').text());

    // Check for tables
    console.log('Tables found:', $('table').length);
    $('table').each((i, el) => {
        console.log(`Table ${i} ID:`, $(el).attr('id'));
        console.log(`Table ${i} Class:`, $(el).attr('class'));
        console.log(`Table ${i} Parent ID:`, $(el).parent().attr('id'));
        // log first row
        console.log(`Table ${i} First Row:`, $(el).find('tr').first().text().replace(/\s+/g, ' ').substring(0, 100));
    });

    // Check for the dropdown
    console.log('Dropdown found:', $('select#cmbYear').length);
}

main();
