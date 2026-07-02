# talir.mk — Phased implementation plan for Cursor

**How to execute (instructions to the agent):** Work ONE phase at a time, in order. For each phase: (1) run the audit step and report findings before changing code, (2) implement, (3) verify every item in the "Done when" checklist and print the checklist with pass/fail, (4) stop and wait for approval before the next phase. Do not skip ahead. Do not partially implement a phase and move on.

The brand system (tokens, typography, logo code, data-display invariants) lives in `.cursor/rules/talir-brand.mdc` and applies to every phase. Where anything in the existing codebase conflicts with that rule, the rule wins.

---

## Phase 0 — Audit only (no code changes)

Produce a written report:

1. **Logo inventory:** grep the entire repo for every place a logo/mark/brand icon is rendered or referenced — components, headers, footers, favicons, manifest icons, OG/meta images, loading screens, emails. List each file and what it currently renders (e.g. "T" monogram, image file, emoji, old SVG).
2. **Colour leaks:** list every hard-coded hex/rgb colour inside components (anything not consuming the semantic tokens), especially any hard-coded green/red on change values.
3. **Font usage:** list which font families are actually loaded and where headings/numbers/body deviate from the Serif/Mono/Sans role split.
4. **Horizontal overflow:** list every container with `overflow-x: scroll|auto` or that overflows a 360px viewport (the indices/stocks carousel is a known offender).
5. **Change-computation sites:** list every place a % change is computed or formatted (there is at least one bug: the live site shows **KMB at −0.00% inside "Top Losers"**, and the header tagline reads **"Skopje · Exchange"**, both wrong per the brand rule).

Done when: the report is printed, grouped by the five categories, with file paths.

---

## Phase 1 — Brand foundation: tokens, fonts, and the correct logo everywhere

1. Install the token CSS from the brand rule as the global stylesheet root. Migrate every hard-coded colour found in Phase 0 to the semantic tokens. Delete dead colour constants.
2. Self-host **Source Serif 4 + IBM Plex Mono + Inter** (Latin + Cyrillic subsets, `font-display: swap`) and enforce the three type roles from the brand rule.
3. Create `components/TalirMark.tsx` and `components/TalirLogo.tsx` **exactly as given in the brand rule** — the 1A "Sovereign" acorn coin. Then **replace every logo instance found in Phase 0** with these components, using the recolor recipe (reversed variant on navy surfaces).
4. **Delete the old logo**: remove old logo components, image assets, and icon files; grep to confirm zero remaining references.
5. Replace `favicon.svg`, `apple-touch-icon.png`, manifest/maskable icons, and the OG image with the hard-coded-hex assets from the brand rule §3c. (Reminder: CSS variables do not resolve in standalone SVG/PNG assets.)
6. Fix the header tagline to `Makedonska Berza · Markets` (Latin) / `Скопје · Берза` (Cyrillic locale, with wordmark `Талир.`).

Done when:
- [ ] The acorn coin renders in: light header, dark header (reversed variant), favicon (browser tab), apple-touch-icon, OG meta tag.
- [ ] `grep` finds no references to any old logo asset/component.
- [ ] `grep` finds no hard-coded green/red hex in components; change values use `var(--up)`/`var(--down)` only.
- [ ] Headings render in Source Serif 4; all prices/%/volumes/tickers in IBM Plex Mono with tabular figures; body/UI in Inter.
- [ ] Cyrillic strings ("ден.", company names, `Талир.`) render in the correct subset fonts, no fallback glyphs.

---

## Phase 2 — Data-display correctness

1. Centralise change formatting into ONE utility (e.g. `formatChange(pct)`) that returns value + sign + arrow + semantic colour token, with the rounding-aware zero rule from the brand rule §4. Every component must use it — remove all local formatting.
2. Fix the ranking bugs: gainers list = strictly positive changes only; losers = strictly negative only; zero-change instruments (incl. −0.00% artifacts like the current KMB entry) appear in neither. Audit and fix the inverted MBI10 change logic globally.
3. Non-trading instruments: carry forward last close, show `0.00%` neutral, never fabricate movement. Failed/partial scrape: show last good data with its **real** as-of date; never blanks-as-zeros.
4. Ensure the freshness label `Data as of [date] · end-of-day close, not live` (mono) is present and discoverable on Home, Markets, and company pages. "Session open/closed" is informational only and must never imply live figures.
5. News: never present months-old filings under a heading implying recency without their real dates visible; each item shows its actual date prominently in mono.

Done when:
- [ ] Single change-formatting utility; grep shows no other component computes sign/colour/arrow locally.
- [ ] No `-0.00%`/`+0.00%` can render (unit-test the utility at pct = 0.004, −0.004, 0, 0.005, −0.005).
- [ ] Gainers/losers lists exclude zero-change instruments.
- [ ] Freshness label visible on all three page types at 360px without scrolling hunt.

---

## Phase 3 — Homepage restructure

1. **Kill the indices/stocks horizontal carousel — hard requirement.** No horizontal scrolling, no horizontal scrollbar, no `overflow-x: scroll|auto` on this section, no carousel fallback, no edge-peeking cards. Replace with a vertical stack of compact rows OR a 2-column grid of small cards that fully fits a 360px viewport. Overflow goes to a dedicated full page, never sideways. Keep the Indices/Stocks tab toggle.
2. Each item: symbol/name, latest close + day-over-day % (mono, via the Phase 2 utility), and a multi-day sparkline (~30 daily closes) from stored history. Reserve fixed sparkline dimensions; handle short-history gracefully (render what exists in reserved space).
3. Fill the dead band between the index card and session status with computed end-of-day signal: a slim **sentiment strip** (X up / Y down / Z unchanged breadth + MBI10 day-over-day, subtle gold/up/down heat accent) and a compact **Top Movers** block (symbol, close, %, mini sparkline; tappable to detail pages), paired with the freshness label.
4. Remove any "Create Portfolio" card from market sections — market sections contain market data only (creation moves to the nav in Phase 5).

Done when:
- [ ] At 360px: `document.documentElement.scrollWidth === window.innerWidth` on the homepage (zero horizontal overflow).
- [ ] No `overflow-x: scroll|auto` in the indices/stocks section (grep).
- [ ] No visual void between sections; consistent 8px rhythm top to bottom.

---

## Phase 4 — Markets list modernization

1. Per-row (all 185 instruments): prominent day-over-day % change (mono, Phase 2 utility) + inline multi-day sparkline + directional indicator. Keep symbol badge + name; demote volume to muted secondary text. Fixed column widths for change/sparkline so mono figures align.
2. Section header: slim computed breadth strip and/or MBI10 with day-over-day %, paired with the as-of label.
3. Filter chips (Most Active / Top Movers / Price / Name): gold-accent active state; chips wrap — never horizontal scroll.
4. Hairline dividers (`--border`) instead of heavy card borders; tighten vertical rhythm; rows ≥ 44px touch targets.

Done when:
- [ ] Every row shows % change + sparkline; columns align via tabular mono.
- [ ] Chips wrap at 360px with no horizontal scrolling.
- [ ] List renders smoothly with all 185 instruments (virtualize if needed).

---

## Phase 5 — Bottom navigation + Create

1. Replace the flat nav with **4 tabs around a raised circular centre button**: Home, Markets, Watchlist, Search (News stays reachable, e.g. inside Home/Markets or a header link). The raised button uses navy/gold consistent with the coin.
2. Centre button icon reads as personal — Lucide `user-plus` preferred (`folder-plus` or `star` acceptable). On tap, a bottom sheet with two options, each icon + one-line sans description: **Create Watchlist** (`list`/`eye`) and **Create Portfolio** (`briefcase`/`chart-line`).
3. Respect safe-area insets (`env(safe-area-inset-bottom)`) so the button never clips against the home indicator.

Done when:
- [ ] 4 tabs + centre button at 360px, all touch targets ≥ 44×44px.
- [ ] Bottom sheet opens/closes with both actions; old in-content create cards are gone (grep).
- [ ] No clipping with iOS safe areas (test with viewport-fit=cover).

---

## Phase 6 — Responsive sweep + performance

1. Verify seamless layouts at **360, 390, 768, 1024, 1440px**: single-column reflow on mobile (rebuilt hierarchy, not shrunken desktop); tablet/desktop may use multi-column grids; sticky compact header on company pages (symbol + close + % while scrolling); charts touch-native (drag-to-scrub, no hover-only interactions).
2. Horizontal scroll allowed ONLY for genuinely wide data tables: frozen first column (ticker), edge-fade affordance — prefer fit-to-viewport everywhere else.
3. Performance: static-generate market/company pages on each end-of-day scrape; precompute all derived metrics (change, sparklines, breadth, movers, search index) at build time; hydrate only interactive islands; lightweight canvas chart lib (lightweight-charts or uPlot); route-level code-splitting; lazy-load charts + search index; AVIF/WebP images sized and lazy below the fold.
4. Sponsor slots per spec: fixed-dimension reserved slots only (one slim leaderboard and/or one desktop sidebar; ≤1 native in-feed per 6–8 items labeled "Спонзор / Sponsored" in mono; one mobile in-flow slot). No interstitials/sticky/anchored/animated ads. Graceful house state when unsold. Never above primary data or inside charts.
5. Explicit dimensions on every chart, sparkline, image, and ad slot.

Done when:
- [ ] Lighthouse mobile: LCP < 2.0s (4G), INP < 200ms, CLS < 0.1, first-load JS < ~150KB gzipped.
- [ ] Zero horizontal overflow at 360px on Home, Markets, News, company pages (scrollWidth check on each).
- [ ] Dark theme audit: every surface/text/change colour comes from the dark semantic layer; navy (not near-black) backgrounds; reversed logo variant on navy.
