'use client'

import { createContext, useContext } from 'react'
import type { StockSummary } from '@/lib/types'
import type { SearchIndexItem } from '@/lib/data'

const InstrumentsContext = createContext<StockSummary[]>([])
const SearchIndexContext = createContext<SearchIndexItem[]>([])

export function InstrumentsProvider({
    instruments,
    searchIndex = [],
    children,
}: {
    instruments: StockSummary[]
    searchIndex?: SearchIndexItem[]
    children: React.ReactNode
}) {
    return (
        <InstrumentsContext.Provider value={instruments}>
            <SearchIndexContext.Provider value={searchIndex}>{children}</SearchIndexContext.Provider>
        </InstrumentsContext.Provider>
    )
}

export function useInstruments() {
    return useContext(InstrumentsContext)
}

export function useSearchIndex() {
    return useContext(SearchIndexContext)
}
