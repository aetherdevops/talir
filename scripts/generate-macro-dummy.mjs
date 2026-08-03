/**
 * One-shot generator for illustrative MK-flavoured macro dummy series.
 * Run: node scripts/generate-macro-dummy.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outPath = path.join(root, 'lib', 'data', 'derived_macro.json')

function monthlyDates(startY, startM, endY, endM) {
    const out = []
    let y = startY
    let m = startM
    while (y < endY || (y === endY && m <= endM)) {
        out.push(`${y}-${String(m).padStart(2, '0')}-01`)
        m++
        if (m > 12) {
            m = 1
            y++
        }
    }
    return out
}

function quarterlyDates(startY, startQ, endY, endQ) {
    const out = []
    let y = startY
    let q = startQ
    while (y < endY || (y === endY && q <= endQ)) {
        const month = q * 3
        out.push(`${y}-${String(month).padStart(2, '0')}-01`)
        q++
        if (q > 4) {
            q = 1
            y++
        }
    }
    return out
}

function wave(dates, base, amp, drift, phase = 0, noise = 0.15) {
    return dates.map((date, i) => {
        const t = i / 12
        const v =
            base +
            drift * t +
            amp * Math.sin((i / 6) * Math.PI + phase) +
            noise * Math.sin(i * 1.7 + phase * 2)
        return { date, value: Math.round(v * 10) / 10 }
    })
}

const monthly = monthlyDates(2014, 1, 2026, 3)
const quarterly = quarterlyDates(2014, 1, 2025, 4)

const series = [
    {
        id: 'gdp_real_yoy',
        labelEn: 'Real GDP growth',
        labelMk: 'Раст на реален БДП',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: 1,
        points: wave(quarterly, 2.4, 1.8, 0.02, 0.2, 0.25),
    },
    {
        id: 'unemployment_rate',
        labelEn: 'Unemployment rate',
        labelMk: 'Стапка на невработеност',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: 2,
        points: wave(monthly, 16.5, 2.2, -0.35, 1.1, 0.2).map((p) => ({
            ...p,
            value: Math.max(8.5, Math.min(22, p.value)),
        })),
    },
    {
        id: 'cpi_yoy',
        labelEn: 'Inflation (CPI YoY)',
        labelMk: 'Инфлација (CPI г/г)',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: 3,
        points: wave(monthly, 2.8, 3.5, 0.01, 2.4, 0.4).map((p) => ({
            ...p,
            value: Math.max(-0.5, Math.min(14, p.value)),
        })),
    },
    {
        id: 'policy_rate',
        labelEn: 'Policy rate',
        labelMk: 'Основна каматна стапка',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: 4,
        points: wave(monthly, 3.5, 1.2, 0.05, 0.8, 0.1).map((p) => ({
            ...p,
            value: Math.max(1.5, Math.min(7.5, Math.round(p.value * 4) / 4)),
        })),
    },
    {
        id: 'industrial_production_yoy',
        labelEn: 'Industrial production YoY',
        labelMk: 'Индустриско производство г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: 5,
        points: wave(monthly, 1.5, 4.0, 0.0, 3.1, 0.5),
    },
    {
        id: 'exports_yoy',
        labelEn: 'Goods exports YoY',
        labelMk: 'Извоз на стоки г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: null,
        points: wave(monthly, 4.0, 6.0, 0.03, 1.5, 0.6),
    },
    {
        id: 'retail_sales_yoy',
        labelEn: 'Retail sales YoY',
        labelMk: 'Промет во малопродажба г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: null,
        points: wave(monthly, 3.2, 3.0, 0.02, 2.2, 0.35),
    },
    {
        id: 'budget_balance_gdp',
        labelEn: 'Budget balance / GDP',
        labelMk: 'Буџетски биланс / БДП',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        sourceLabel: 'Dummy · placeholder',
        kpiOrder: null,
        points: wave(quarterly, -2.8, 1.0, 0.01, 0.5, 0.2),
    },
]

const news = [
    {
        id: 'n1',
        date: '2026-03-15',
        titleEn: 'Dummy: Q4 GDP estimate revised slightly higher',
        titleMk: 'Пример: Проценката за БДП во Q4 малку ревидирана нагоре',
    },
    {
        id: 'n2',
        date: '2026-03-01',
        titleEn: 'Dummy: CPI eases for a third consecutive month',
        titleMk: 'Пример: CPI се ублажува трет месец по ред',
    },
    {
        id: 'n3',
        date: '2026-02-12',
        titleEn: 'Dummy: Labour survey shows unemployment near multi-year low',
        titleMk: 'Пример: Анкетата за труд покажува невработеност близу повеќегодишен минимум',
    },
    {
        id: 'n4',
        date: '2026-01-28',
        titleEn: 'Dummy: Policy rate held unchanged at the latest meeting',
        titleMk: 'Пример: Основната каматна стапка задржана без промена',
    },
    {
        id: 'n5',
        date: '2026-01-10',
        titleEn: 'Dummy: Industrial production recovers after soft autumn',
        titleMk: 'Пример: Индустриското производство се опоравува по слаб есенски период',
    },
]

const payload = {
    generatedAt: new Date().toISOString(),
    asOfDate: '2026-03-01',
    disclaimerEn:
        'Illustrative dummy series for UI development — not official statistics. Source wiring comes later.',
    disclaimerMk:
        'Илустративни пример-серии за UI — не се официјална статистика. Изворот ќе се поврзе подоцна.',
    series,
    news,
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(`Wrote ${series.length} series, ${news.length} news → ${outPath}`)
