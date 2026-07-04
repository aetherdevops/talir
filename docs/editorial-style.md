# Talir editorial style — filings & disclosures

This document is the human-readable standard for headline copy on Talir. The code equivalent lives in `lib/news-style.ts`.

## Purpose

Talir surfaces **regulatory filings and disclosures** from the Macedonian Stock Exchange and SECNet — not a news wire. Credibility is the product.

## Register

- Factual, sober, journalistic — Reuters-adjacent, not marketing copy.
- Short headlines: company code + what was filed.
- Neutral on positive and negative outcomes alike.

## Headline rules

1. **State facts, not drama.** Headlines describe the filing type and period.
2. **Use “files” or “reports”** — not “announces”, “reveals”, “unveils”, or hype verbs.
3. **Losses are reported plainly** when the source title indicates a loss. Do not soften or sensationalize.
4. **Never invent figures** not present in the raw filing title.
5. **No clickbait framing** — banned words include: shock, soar, plunge, bombshell, alert, rocket, crash, surge, tumble.

## Examples

| Raw filing title (excerpt) | Headline |
| --- | --- |
| Non-audited profit&loss account 01.01. - 30.09. | `KMB reports profit and loss for 01.01.–30.09.` |
| Audited financial statements | `KMB files audited financial statements` |
| Dividend … | `KMB files dividend disclosure` |
| Annual report | `KMB files annual report` |
| Title containing “loss” | `KMB reports loss for {period}` (when period known) |

## Dates

- Every dated item shows an absolute filing date (IBM Plex Mono) in the UI.
- Items without a parseable date are **excluded from the main feed** and shown on the company page under **Date unknown**.

## What we do not do

- Imply live or breaking news.
- Add analyst opinion, price targets, or sentiment.
- Reframe negative filings with positive spin.

## Filing indicator dots

Dots on Updates items encode **filing type**, not market sentiment (see `getFilingIndicatorTier` in `lib/news.ts`):

| Dot | Meaning |
| --- | --- |
| Red (`--down`) | Material event — delisting, suspension, bankruptcy, liquidation (keyword match on raw filing title) |
| Gold (`--accent`) | Dividend / payout disclosure |
| Gray (`--neutral`) | Routine filing — financials, earnings, corporate, other |

Unknown titles default to routine/neutral. Material keywords include English, Latin transliterations, and Macedonian Cyrillic (e.g. ликвидација, стечај, суспензија, делистирање).

## Maintenance

When adding new filing patterns in `parseReportTitle`, update this document with one example row.
