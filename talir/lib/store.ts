import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
    theme: 'light' | 'dark'
    isSidebarOpen: boolean
    toggleTheme: () => void
    toggleSidebar: () => void
    setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'light',
            isSidebarOpen: true,
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light'
                if (typeof window !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark')
                    document.documentElement.classList.add(newTheme)
                }
                return { theme: newTheme }
            }),
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setTheme: (theme) => set(() => {
                if (typeof window !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark')
                    document.documentElement.classList.add(theme)
                }
                return { theme }
            }),
        }),
        {
            name: 'talir-ui-storage',
            onRehydrateStorage: () => (state) => {
                if (state && typeof window !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark')
                    document.documentElement.classList.add(state.theme)
                }
            }
        }
    )
)
