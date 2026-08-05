import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WatchlistItem {
    code: string
    addedAt: string
}

export interface Watchlist {
    id: string
    name: string
    items: WatchlistItem[]
    createdAt: string
}

interface WatchlistState {
    watchlists: Watchlist[]
    activeListId: string | null

    createList: (name: string) => void
    deleteList: (id: string) => void
    renameList: (id: string, name: string) => void
    setActiveList: (id: string) => void
    addToList: (listId: string, code: string) => void
    removeFromList: (listId: string, code: string) => void
    isInList: (listId: string, code: string) => boolean
    replaceAll: (watchlists: Watchlist[], activeListId: string | null) => void
}

export function createDefaultWatchlist(now = new Date().toISOString()): Watchlist {
    return {
        id: 'default',
        name: 'Watchlist',
        items: [],
        createdAt: now,
    }
}

/** Never leave the UI with zero lists — empty auth sync / clear-local used to crash WatchlistClient. */
export function normalizeWatchlists(
    watchlists: Watchlist[],
    activeListId: string | null
): { watchlists: Watchlist[]; activeListId: string } {
    if (watchlists.length === 0) {
        const fallback = createDefaultWatchlist()
        return { watchlists: [fallback], activeListId: fallback.id }
    }
    const resolvedActive =
        activeListId && watchlists.some((w) => w.id === activeListId)
            ? activeListId
            : watchlists[0].id
    return { watchlists, activeListId: resolvedActive }
}

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set, get) => ({
            watchlists: [createDefaultWatchlist()],
            activeListId: 'default',

            createList: (name) =>
                set((state) => {
                    const newList: Watchlist = {
                        id: crypto.randomUUID(),
                        name,
                        items: [],
                        createdAt: new Date().toISOString(),
                    }
                    return {
                        watchlists: [...state.watchlists, newList],
                        activeListId: newList.id,
                    }
                }),

            deleteList: (id) =>
                set((state) => {
                    const newLists = state.watchlists.filter((l) => l.id !== id)
                    if (newLists.length === 0) {
                        const fallback = createDefaultWatchlist()
                        return {
                            watchlists: [fallback],
                            activeListId: fallback.id,
                        }
                    }

                    let newActiveId = state.activeListId
                    if (state.activeListId === id) {
                        newActiveId = newLists[0].id
                    }

                    return { watchlists: newLists, activeListId: newActiveId }
                }),

            renameList: (id, name) =>
                set((state) => ({
                    watchlists: state.watchlists.map((l) => (l.id === id ? { ...l, name } : l)),
                })),

            setActiveList: (id) => set({ activeListId: id }),

            addToList: (listId, code) =>
                set((state) => ({
                    watchlists: state.watchlists.map((l) => {
                        if (l.id !== listId) return l
                        if (l.items.some((i) => i.code === code)) return l
                        return {
                            ...l,
                            items: [...l.items, { code, addedAt: new Date().toISOString() }],
                        }
                    }),
                })),

            removeFromList: (listId, code) =>
                set((state) => ({
                    watchlists: state.watchlists.map((l) => {
                        if (l.id !== listId) return l
                        return {
                            ...l,
                            items: l.items.filter((i) => i.code !== code),
                        }
                    }),
                })),

            isInList: (listId, code) => {
                const list = get().watchlists.find((l) => l.id === listId)
                return list ? list.items.some((i) => i.code === code) : false
            },

            replaceAll: (watchlists, activeListId) => set(normalizeWatchlists(watchlists, activeListId)),
        }),
        {
            name: 'talir-watchlist-storage',
            storage: createJSONStorage(() => localStorage),
            merge: (persisted, current) => {
                const p = (persisted ?? {}) as Partial<WatchlistState>
                const normalized = normalizeWatchlists(
                    Array.isArray(p.watchlists) ? p.watchlists : current.watchlists,
                    p.activeListId ?? current.activeListId
                )
                return { ...current, ...p, ...normalized }
            },
        }
    )
)
