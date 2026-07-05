
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.mse.mk';
const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'issuers.json');

interface ReportLink {
    title: string;
    url: string;
    date: string;
}

interface IssuerDetails {
    code: string;
    name: string;
    sector: string;
    address: string;
    city: string;
    phone: string;
    website: string;
    reportLinks: ReportLink[];
    disclosureLinks: ReportLink[];
}

async function fetchHtml(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.text();
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
}

function normalizeIsoDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (us) return formatIso(Number(us[3]), Number(us[1]), Number(us[2]));

    const eu = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (eu) return formatIso(Number(eu[3]), Number(eu[2]), Number(eu[1]));

    return '';
}

function formatIso(year: number, month: number, day: number): string {
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseReportDate(title: string, explicitDate?: string): string {
    if (explicitDate?.trim()) {
        const iso = normalizeIsoDate(explicitDate.trim());
        if (iso) return iso;
    }

    const fromTitle = title.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fromTitle) {
        return formatIso(Number(fromTitle[3]), Number(fromTitle[1]), Number(fromTitle[2]));
    }

    return '';
}

function scrapeLinksFromContainer(
    $: cheerio.CheerioAPI,
    selector: string,
    seenUrls: Set<string>
): ReportLink[] {
    const links: ReportLink[] = [];

    $(`${selector} a`).each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href || !(href.includes('seinet.com.mk') || href.includes('ViewNews'))) return;

        const absoluteUrl = href.startsWith('http') ? href : `https://seinet.com.mk${href}`;
        const dedupeKey = absoluteUrl.toLowerCase();
        if (seenUrls.has(dedupeKey)) return;
        seenUrls.add(dedupeKey);

        const row = $(el).closest('tr, li, div');
        const rowText = row.text().replace(/\s+/g, ' ').trim();
        const siblingDate = rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1]
            ?? rowText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1]
            ?? '';

        links.push({
            title: text,
            url: absoluteUrl,
            date: parseReportDate(text, siblingDate),
        });
    });

    return links;
}

async function scrapeIssuerDetails(code: string, details: IssuerDetails) {
    const url = `${BASE_URL}/en/symbol/${code}`;
    console.log(`Scraping details for ${code} (${url})...`);
    const html = await fetchHtml(url);
    if (!html) return;

    const $ = cheerio.load(html);
    const seenUrls = new Set<string>();

    details.reportLinks = scrapeLinksFromContainer($, 'div#seiNetIssuerFinancialNews', seenUrls);
    details.disclosureLinks = scrapeLinksFromContainer($, 'div#seiNetIssuerLatestNews', seenUrls);
}

function isExcludedEquityCode(code: string): boolean {
    if (code === 'MBI10' || code === 'OMB') return true;
    if (/^M\d/.test(code) || code.startsWith('RMDEN')) return true;
    return false;
}

async function main() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const issuers = new Map<string, IssuerDetails>();

    const summaryFile = path.join(DATA_DIR, 'market_summary.json');
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8')) as Array<{ code: string; name: string }>;
    const nameToCode = new Map<string, string>();

    summaryData.forEach((item) => {
        if (!item.name || !item.code || isExcludedEquityCode(item.code)) return;
        nameToCode.set(item.name.toLowerCase().trim(), item.code);
        nameToCode.set(item.name.toLowerCase().replace(/\s+/g, ' ').trim(), item.code);

        if (!issuers.has(item.code)) {
            issuers.set(item.code, {
                code: item.code,
                name: item.name.trim(),
                sector: '',
                address: '',
                city: '',
                phone: '',
                website: '',
                reportLinks: [],
                disclosureLinks: [],
            });
        }
    });

    console.log(`Seeded ${issuers.size} issuers from market summary.`);

    await scrapeListingPage(`${BASE_URL}/en/issuers/super-listing`, issuers, nameToCode);
    await scrapeListingPage(`${BASE_URL}/en/issuers/exchange-listing`, issuers, nameToCode);
    await scrapeListingPage(`${BASE_URL}/en/issuers/mandatory-listing`, issuers, nameToCode);

    console.log(`Found ${issuers.size} issuers. Starting detail scrape...`);

    const codes = Array.from(issuers.keys());
    const CHUNK_SIZE = 5;

    for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
        const chunk = codes.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(code => scrapeIssuerDetails(code, issuers.get(code)!)));
        await new Promise(r => setTimeout(r, 500));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(Array.from(issuers.values()), null, 2));
    console.log(`Saved issuers data to ${OUTPUT_FILE}`);
}

async function scrapeListingPage(url: string, issuers: Map<string, IssuerDetails>, nameToCode: Map<string, string>) {
    console.log(`Scraping listing page: ${url}`);
    const html = await fetchHtml(url);
    if (!html) return;

    const $ = cheerio.load(html);
    const rows = $('table.table tbody tr');

    for (const row of rows) {
        const cells = $(row).find('td');
        if (cells.length < 7) continue;

        const nameLink = $(cells[1]).find('a');
        const nameText = nameLink.text().trim();

        let code = nameToCode.get(nameText.toLowerCase());
        if (!code) {
            code = nameToCode.get(nameText.toLowerCase().replace(/\s+/g, ' '));
        }

        if (!code) {
            console.warn(`No code found for company: "${nameText}"`);
            continue;
        }

        const business = $(cells[2]).text().trim();
        const address = $(cells[3]).text().trim();
        const city = $(cells[4]).text().trim();
        const phone = $(cells[5]).text().trim();
        const siteLink = $(cells[6]).find('a').attr('href') || '';

        const existing = issuers.get(code);
        issuers.set(code, {
            code,
            name: nameText || existing?.name || code,
            sector: business || existing?.sector || '',
            address: address || existing?.address || '',
            city: city || existing?.city || '',
            phone: phone || existing?.phone || '',
            website: siteLink || existing?.website || '',
            reportLinks: existing?.reportLinks ?? [],
            disclosureLinks: existing?.disclosureLinks ?? [],
        });
    }
}

main().catch(console.error);
