'use client'

import { createContext, useContext } from 'react'
import type { StockSummary } from '@/lib/types'

const InstrumentsContext = createContext<StockSummary[]>([])

export function InstrumentsProvider({
    instruments,
    children,
}: {
    instruments: StockSummary[]
    children: React.ReactNode
}) {
    return (
        <InstrumentsContext.Provider value={instruments}>
            {children}
        </InstrumentsContext.Provider>
    )
}

export function useInstruments() {
    return useContext(InstrumentsContext)
}
