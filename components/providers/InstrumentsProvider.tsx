'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import type { StockSummary } from '@/lib/types'
import type { SearchIndexItem } from '@/lib/data'

const InstrumentsContext = createContext<StockSummary[]>([])

type SearchIndexContextValue = {
    items: SearchIndexItem[]
    loading: boolean
    ensureLoaded: () => void
}

const SearchIndexContext = createContext<SearchIndexContextValue>({
    items: [],
    loading: false,
    ensureLoaded: () => {},
})

let searchIndexPromise: Promise<SearchIndexItem[]> | null = null

function fetchSearchIndex(): Promise<SearchIndexItem[]> {
    if (!searchIndexPromise) {
        searchIndexPromise = fetch('/api/search-index')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load search index')
                return res.json()
            })
            .then((data: { items?: SearchIndexItem[] }) => data.items ?? [])
            .catch(() => {
                searchIndexPromise = null
                return []
            })
    }
    return searchIndexPromise
}

export function InstrumentsProvider({
    instruments,
    children,
}: {
    instruments: StockSummary[]
    children: React.ReactNode
}) {
    const [items, setItems] = useState<SearchIndexItem[]>([])
    const [loading, setLoading] = useState(false)

    const ensureLoaded = useCallback(() => {
        if (items.length > 0) return

        setLoading(true)
        fetchSearchIndex()
            .then((loaded) => setItems(loaded))
            .finally(() => setLoading(false))
    }, [items.length])

    return (
        <InstrumentsContext.Provider value={instruments}>
            <SearchIndexContext.Provider value={{ items, loading, ensureLoaded }}>
                {children}
            </SearchIndexContext.Provider>
        </InstrumentsContext.Provider>
    )
}

export function useInstruments() {
    return useContext(InstrumentsContext)
}

export function useSearchIndex() {
    return useContext(SearchIndexContext)
}
