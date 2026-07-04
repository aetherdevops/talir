import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyThemeToDocument, DEFAULT_THEME, type ThemeMode } from '@/lib/theme'

interface ThemeStore {
    theme: ThemeMode
    isSidebarOpen: boolean
    toggleTheme: () => void
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
    setTheme: (theme: ThemeMode) => void
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: DEFAULT_THEME,
            isSidebarOpen: true,
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light'
                applyThemeToDocument(newTheme)
                return { theme: newTheme }
            }),
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),
            setTheme: (theme) => {
                applyThemeToDocument(theme)
                set({ theme })
            },
        }),
        {
            name: 'talir-ui-storage',
            onRehydrateStorage: () => (state) => {
                if (state && typeof window !== 'undefined') {
                    applyThemeToDocument(state.theme)
                }
            }
        }
    )
)
