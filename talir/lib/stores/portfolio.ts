
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Holding {
    id: string
    code: string
    quantity: number
    buyPrice: number
    buyDate: string
    addedAt: string
}

export interface Portfolio {
    id: string
    name: string
    holdings: Holding[]
    createdAt: string
    currency: 'MKD' | 'EUR' | 'USD'
}

interface PortfolioState {
    portfolios: Portfolio[]
    activePortfolioId: string | null

    createPortfolio: (name: string) => void
    deletePortfolio: (id: string) => void
    renamePortfolio: (id: string, name: string) => void
    copyPortfolio: (id: string) => void
    setPortfolioCurrency: (id: string, currency: 'MKD' | 'EUR' | 'USD') => void
    setActivePortfolio: (id: string) => void

    addHolding: (portfolioId: string, holding: Omit<Holding, 'id' | 'addedAt'>) => void
    updateHolding: (portfolioId: string, holdingId: string, updates: Partial<Holding>) => void
    removeHolding: (portfolioId: string, holdingId: string) => void
    getHolding: (portfolioId: string, holdingId: string) => Holding | undefined
}

export const usePortfolioStore = create<PortfolioState>()(
    persist(
        (set, get) => ({
            portfolios: [],
            activePortfolioId: null,

            createPortfolio: (name) => set((state) => {
                const newPortfolio: Portfolio = {
                    id: crypto.randomUUID(),
                    name,
                    holdings: [],
                    createdAt: new Date().toISOString(),
                    currency: 'MKD'
                }
                return {
                    portfolios: [...state.portfolios, newPortfolio],
                    activePortfolioId: state.activePortfolioId || newPortfolio.id
                }
            }),

            deletePortfolio: (id) => set((state) => {
                const newPortfolios = state.portfolios.filter(p => p.id !== id)
                return {
                    portfolios: newPortfolios,
                    activePortfolioId: state.activePortfolioId === id
                        ? (newPortfolios.length > 0 ? newPortfolios[0].id : null)
                        : state.activePortfolioId
                }
            }),

            renamePortfolio: (id, name) => set((state) => ({
                portfolios: state.portfolios.map(p => p.id === id ? { ...p, name } : p)
            })),

            copyPortfolio: (id) => set((state) => {
                const portfolio = state.portfolios.find(p => p.id === id)
                if (!portfolio) return state

                const newPortfolio: Portfolio = {
                    ...portfolio,
                    id: crypto.randomUUID(),
                    name: `${portfolio.name} (Copy)`,
                    createdAt: new Date().toISOString(),
                    holdings: portfolio.holdings.map(h => ({ ...h, id: crypto.randomUUID() }))
                }
                return {
                    portfolios: [...state.portfolios, newPortfolio],
                    activePortfolioId: newPortfolio.id
                }
            }),

            setPortfolioCurrency: (id, currency) => set((state) => ({
                portfolios: state.portfolios.map(p => p.id === id ? { ...p, currency } : p)
            })),

            setActivePortfolio: (id) => set({ activePortfolioId: id }),

            addHolding: (portfolioId, holding) => set((state) => ({
                portfolios: state.portfolios.map(p => {
                    if (p.id !== portfolioId) return p
                    return {
                        ...p,
                        holdings: [...p.holdings, {
                            ...holding,
                            id: crypto.randomUUID(),
                            addedAt: new Date().toISOString()
                        }]
                    }
                })
            })),

            updateHolding: (portfolioId, holdingId, updates) => set((state) => ({
                portfolios: state.portfolios.map(p => {
                    if (p.id !== portfolioId) return p
                    return {
                        ...p,
                        holdings: p.holdings.map(h => h.id === holdingId ? { ...h, ...updates } : h)
                    }
                })
            })),

            removeHolding: (portfolioId, holdingId) => set((state) => ({
                portfolios: state.portfolios.map(p => {
                    if (p.id !== portfolioId) return p
                    return {
                        ...p,
                        holdings: p.holdings.filter(h => h.id !== holdingId)
                    }
                })
            })),

            getHolding: (portfolioId, holdingId) => {
                const portfolio = get().portfolios.find(p => p.id === portfolioId)
                return portfolio?.holdings.find(h => h.id === holdingId)
            }
        }),
        {
            name: 'talir-portfolio-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                // Migration logic for old single-portfolio structure if needed could go here
                // For now we assume fresh start or overwrite is acceptable as per dev prototype
                if (state && (!state.portfolios || state.portfolios.length === 0)) {
                    state.createPortfolio("My Portfolio")
                }
            }
        }
    )
)
