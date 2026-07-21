/**
 * Official macro series catalog — MakStat / NBStat / MoF attribution + PxWeb query specs.
 */

import type { MacroFrequency, MacroSeriesCategory } from '../macro'

export type PxWebQuerySpec = {
    baseUrl: string
    tablePath: string
    /** Variable codes → selection values (or 'all' / 'tail:N' / 'head:N'). Resolved against live metadata. */
    selections: Record<string, string[] | 'all' | `tail:${number}` | `head:${number}`>
    /**
     * Transform raw cell value before store.
     * e.g. index YoY 103.2 → 3.2
     */
    valueTransform?: 'identity' | 'indexMinus100'
    /** Dimension code that carries the time axis (Month / Quarter / Year). */
    timeCodeHint?: string
}

export type MacroSeriesCatalogEntry = {
    id: string
    labelEn: string
    labelMk: string
    unit: '%' | 'pp' | 'index'
    deltaUnit: 'pp' | '%' | 'pts'
    frequency: MacroFrequency
    category: MacroSeriesCategory
    kpiOrder: number | null
    sourceAgency: string
    sourceLabel: string
    sourceUrl: string
    pxweb?: PxWebQuerySpec
    /** MoF Excel path — handled separately */
    mofBudget?: boolean
}

const MAKSTAT = 'https://makstat.stat.gov.mk/PXWeb/api/v1/en/MakStat'
const NBSTAT = 'https://nbstat.nbrm.mk/api/v1/en'

export const MACRO_SERIES_CATALOG: MacroSeriesCatalogEntry[] = [
    {
        id: 'gdp_real_yoy',
        labelEn: 'Real GDP growth',
        labelMk: 'Раст на реален БДП',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'headline',
        kpiOrder: 1,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · quarterly GDP volume YoY',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__BDP__BDPTrimesecni__TrimesecniBDPsporedESS2010/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath:
                'BDP/BDPTrimesecni/TrimesecniBDPsporedESS2010/125_NacSmA_Mk_01ProKv_ml.px',
            selections: {
                Сектор: ['1'],
                Мерки: ['5'],
                Тримесечје: 'all',
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Тримесечје',
        },
    },
    {
        id: 'unemployment_rate',
        labelEn: 'Unemployment rate',
        labelMk: 'Стапка на невработеност',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'headline',
        kpiOrder: 2,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · LFS unemployment rate',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__PazarNaTrud__TrimesecniARS/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'PazarNaTrud/TrimesecniARS/420_PazTrud_Mk_24StapAkt_ml.px',
            selections: {
                Тримесечје: 'all',
                'Возрасна група': ['01'],
                Стапка: ['102'],
                Пол: ['1'],
            },
            valueTransform: 'identity',
            timeCodeHint: 'Тримесечје',
        },
    },
    {
        id: 'cpi_yoy',
        labelEn: 'Inflation (CPI YoY)',
        labelMk: 'Инфлација (CPI г/г)',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'headline',
        kpiOrder: 3,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · CPI ECOICOP YoY',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Ceni__IndeksTrosZivot/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'Ceni/IndeksTrosZivot/TrosociZivot/121_CeniTr_Mk_IndTroZi_ecoicop_ml.px',
            selections: {
                Месец: 'all',
                'Базен период': ['03'],
                'Главни COICOP групи': ['001'],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Месец',
        },
    },
    {
        id: 'policy_rate',
        labelEn: 'Policy rate',
        labelMk: 'Основна каматна стапка',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'headline',
        kpiOrder: 4,
        sourceAgency: 'NBRM',
        sourceLabel: 'NBStat · CB bills auction rate',
        sourceUrl: 'https://nbstat.nbrm.mk/pxweb/en/MS%20i%20KS/',
        pxweb: {
            baseUrl: NBSTAT,
            tablePath:
                'MS%20i%20KS/KS/Aktivni%20i%20pasivni%20KS%20na%20NBRM/AktivniPasivniKSMesecniEN.px',
            selections: {
                Item: ['5'],
                Month: 'tail:120',
            },
            valueTransform: 'identity',
            timeCodeHint: 'Month',
        },
    },
    {
        id: 'industrial_production_yoy',
        labelEn: 'Industrial production YoY',
        labelMk: 'Индустриско производство г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'headline',
        kpiOrder: 5,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · IP previous year=100',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Industrija__Bazna2021/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'Industrija/Bazna2021/325_Ind_mk_preth100_21_ml.px',
            selections: {
                Година: 'tail:12',
                'Сектори/Оддели/Главни индустриски групи': ['Total'],
                Месец: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Месец',
        },
    },
    {
        id: 'exports_yoy',
        labelEn: 'Goods exports YoY',
        labelMk: 'Извоз на стоки г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'headline',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · external trade indices (denars, YoY)',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__NadvoresnaTrgovija/',
        pxweb: {
            baseUrl: MAKSTAT,
            // Month codes are newest-first in this table ("Mounth" typo is upstream).
            tablePath: 'NadvoresnaTrgovija/Indikatori/127_mesecni_indeksi_ml.px',
            selections: {
                Mounth: 'head:120',
                Flow: ['R'],
                Indices: ['1'],
                Variables: ['003'],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Mounth',
        },
    },
    {
        id: 'retail_sales_yoy',
        labelEn: 'Retail sales YoY',
        labelMk: 'Малопродажба г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'headline',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · retail trade real change rate (NKD 47)',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__VnatresnaTrgovija__VTBazna2021/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'VnatresnaTrgovija/VTBazna2021/225_VTtrg_Mk_NomReaStapka_2021_ml.px',
            selections: {
                'Група/класа НКД Рев. 2': ['47'],
                Месец: 'all',
                Стапка: ['02'],
            },
            valueTransform: 'identity',
            timeCodeHint: 'Месец',
        },
    },
    {
        id: 'budget_balance_gdp',
        labelEn: 'Budget balance / GDP',
        labelMk: 'Буџетски биланс / БДП',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'headline',
        kpiOrder: null,
        sourceAgency: 'MoF',
        sourceLabel: 'MoF Statistical Review · YTD balance / annual GDP',
        sourceUrl: 'https://finance.gov.mk/en-GB/oblasti/statisticki-pregled',
        mofBudget: true,
    },
    // Economy-by-industry (GDP VA YoY by NKD)
    {
        id: 'gdp_va_industry_yoy',
        labelEn: 'GDP VA · Industry (B–E) YoY',
        labelMk: 'БДП ДД · Индустрија (B–E) г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · GDP production NKD B–E',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__BDP__BDPTrimesecni__TrimesecniBDPsporedESS2010/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath:
                'BDP/BDPTrimesecni/TrimesecniBDPsporedESS2010/125_NacSmA_Mk_01ProKv_ml.px',
            selections: {
                Сектор: ['4'],
                Мерки: ['5'],
                Тримесечје: 'all',
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Тримесечје',
        },
    },
    {
        id: 'gdp_va_manufacturing_yoy',
        labelEn: 'GDP VA · Manufacturing (C) YoY',
        labelMk: 'БДП ДД · Преработувачка (C) г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · GDP production NKD C',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__BDP__BDPTrimesecni__TrimesecniBDPsporedESS2010/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath:
                'BDP/BDPTrimesecni/TrimesecniBDPsporedESS2010/125_NacSmA_Mk_01ProKv_ml.px',
            selections: {
                Сектор: ['5'],
                Мерки: ['5'],
                Тримесечје: 'all',
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Тримесечје',
        },
    },
    {
        id: 'gdp_va_construction_yoy',
        labelEn: 'GDP VA · Construction (F) YoY',
        labelMk: 'БДП ДД · Градежништво (F) г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · GDP production NKD F',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__BDP__BDPTrimesecni__TrimesecniBDPsporedESS2010/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath:
                'BDP/BDPTrimesecni/TrimesecniBDPsporedESS2010/125_NacSmA_Mk_01ProKv_ml.px',
            selections: {
                Сектор: ['6'],
                Мерки: ['5'],
                Тримесечје: 'all',
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Тримесечје',
        },
    },
    {
        id: 'gdp_va_trade_yoy',
        labelEn: 'GDP VA · Trade & transport (G–I) YoY',
        labelMk: 'БДП ДД · Трговија и транспорт (G–I) г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'quarterly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · GDP production NKD G–I',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__BDP__BDPTrimesecni__TrimesecniBDPsporedESS2010/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath:
                'BDP/BDPTrimesecni/TrimesecniBDPsporedESS2010/125_NacSmA_Mk_01ProKv_ml.px',
            selections: {
                Сектор: ['7'],
                Мерки: ['5'],
                Тримесечје: 'all',
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Тримесечје',
        },
    },
    // IP by MIG
    {
        id: 'ip_mig_energy_yoy',
        labelEn: 'IP · Energy MIG YoY',
        labelMk: 'ИП · Енергија MIG г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · IP MIG Energy',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Industrija__Bazna2021/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'Industrija/Bazna2021/325_Ind_mk_preth100_21_ml.px',
            selections: {
                Година: 'tail:12',
                'Сектори/Оддели/Главни индустриски групи': ['mig AE'],
                Месец: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Месец',
        },
    },
    {
        id: 'ip_mig_intermediate_yoy',
        labelEn: 'IP · Intermediate goods MIG YoY',
        labelMk: 'ИП · Меѓупроизводи MIG г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · IP MIG Intermediate',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Industrija__Bazna2021/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'Industrija/Bazna2021/325_Ind_mk_preth100_21_ml.px',
            selections: {
                Година: 'tail:12',
                'Сектори/Оддели/Главни индустриски групи': ['mig AI'],
                Месец: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Месец',
        },
    },
    {
        id: 'ip_mig_capital_yoy',
        labelEn: 'IP · Capital goods MIG YoY',
        labelMk: 'ИП · Капитални добра MIG г/г',
        unit: '%',
        deltaUnit: 'pp',
        frequency: 'monthly',
        category: 'industry',
        kpiOrder: null,
        sourceAgency: 'SSO',
        sourceLabel: 'MakStat · IP MIG Capital',
        sourceUrl:
            'https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Industrija__Bazna2021/',
        pxweb: {
            baseUrl: MAKSTAT,
            tablePath: 'Industrija/Bazna2021/325_Ind_mk_preth100_21_ml.px',
            selections: {
                Година: 'tail:12',
                'Сектори/Оддели/Главни индустриски групи': ['mig B'],
                Месец: [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                ],
            },
            valueTransform: 'indexMinus100',
            timeCodeHint: 'Месец',
        },
    },
]

export function catalogById(id: string): MacroSeriesCatalogEntry | undefined {
    return MACRO_SERIES_CATALOG.find((s) => s.id === id)
}
