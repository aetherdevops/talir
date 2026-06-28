"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Newspaper, PieChart, Bookmark, Settings, Plus, BarChart2, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/lib/store'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { CreatePortfolioModal } from "@/components/portfolio/CreatePortfolioModal"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SidebarItemProps {
    icon: React.ElementType
    label: string
    href: string
    isActive?: boolean
    isCollapsed?: boolean
    iconClass?: string
    onClick?: () => void
}

// Fixed dimensions for icon container to ensure perfect "badge" uniformity
const ICON_CONTAINER_CLASS = "flex items-center justify-center w-10 h-10 flex-shrink-0"

function SidebarItem({ icon: Icon, label, href, isActive, isCollapsed, iconClass, onClick }: SidebarItemProps) {
    return (
        <li>
            <Link
                href={href}
                onClick={onClick}
                className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group relative my-1 overflow-hidden",
                    isActive
                        ? "bg-brand-active text-brand-text font-bold"
                        : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                    isCollapsed ? "justify-center px-0 w-10 mx-auto" : "w-full px-2"
                )}
                title={isCollapsed ? label : undefined}
            >
                <div className={cn(ICON_CONTAINER_CLASS, iconClass)}>
                    <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                <div className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300 ease-sidebar flex items-center",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 pl-2"
                )}>
                    <span className="text-sm font-medium">{label}</span>
                </div>
            </Link>
        </li>
    )
}

function SectionHeader({ label, onAdd, isCollapsed }: { label: string, onAdd?: () => void, isCollapsed?: boolean }) {
    if (isCollapsed) return <li className="my-2"><div className="h-px bg-border w-6 mx-auto" /></li>

    return (
        <li className="flex items-center justify-between px-4 py-2 mt-4 mb-2 group cursor-pointer transition-opacity duration-300 animate-fade-in">
            <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary group-hover:text-text-secondary transition-colors">{label}</span>
            {onAdd && (
                <button
                    className="text-text-tertiary hover:text-brand-text p-1 rounded-full hover:bg-surface-secondary transition-all"
                    onClick={(e) => {
                        e.stopPropagation()
                        onAdd()
                    }}
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            )}
        </li>
    )
}

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { isSidebarOpen, toggleSidebar } = useThemeStore()
    const { createPortfolio, portfolios, activePortfolioId, setActivePortfolio } = usePortfolioStore()
    const [mounted, setMounted] = useState(false)
    const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isOpen = mounted ? isSidebarOpen : false

    return (
        <aside
            className={cn(
                // Structure: No more sticky. It fills height of flex parent.
                "hidden md:flex flex-col h-full bg-surface border-r border-border z-40 pb-2 overflow-hidden",
                "transition-[width] duration-300 ease-sidebar will-change-[width]",
                isOpen ? "w-[260px]" : "w-[72px]",
                className
            )}
        >
            <nav className="flex-1 w-full overflow-y-auto scrollbar-hide pt-4">
                <ul className="space-y-1 px-3">
                    <SidebarItem icon={Home} label="Home" href="/" isActive={pathname === '/'} isCollapsed={!isOpen} />
                    <SidebarItem icon={BarChart2} label="Market Overview" href="/markets" isActive={pathname === '/markets'} isCollapsed={!isOpen} />
                    <SidebarItem icon={Newspaper} label="All News" href="/news" isActive={pathname === '/news'} isCollapsed={!isOpen} />

                    <SectionHeader
                        label="Portfolios"
                        onAdd={() => setIsCreatePortfolioModalOpen(true)}
                        isCollapsed={!isOpen}
                    />

                    {portfolios.map(p => (
                        <SidebarItem
                            key={p.id}
                            icon={PieChart}
                            label={p.name}
                            href="/portfolio"
                            isActive={pathname === '/portfolio' && activePortfolioId === p.id}
                            isCollapsed={!isOpen}
                            onClick={() => setActivePortfolio(p.id)}
                            iconClass={p.id === activePortfolioId ? "text-brand-500" : undefined}
                        />
                    ))}

                    <SectionHeader label="Watchlists" isCollapsed={!isOpen} />

                    <SidebarItem
                        icon={Bookmark}
                        label="My Watchlist"
                        href="/watchlist"
                        isActive={pathname.startsWith('/watchlist')}
                        isCollapsed={!isOpen}
                    />

                    <SectionHeader label="Alerts" isCollapsed={!isOpen} />

                    <SidebarItem
                        icon={Bell}
                        label="My Alerts"
                        href="/alerts"
                        isActive={pathname === '/alerts'}
                        isCollapsed={!isOpen}
                    />
                </ul>
            </nav>

            <div className="mt-auto border-t border-border bg-surface w-full p-3">
                <div className={cn("flex mb-2", !isOpen ? "justify-center" : "justify-end")}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="w-10 h-10 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
                    >
                        {!isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                <ul className="space-y-1">
                    {/* <SidebarItem icon={Settings} label="Settings" href="/settings" isActive={pathname === '/settings'} isCollapsed={!isOpen} /> */}
                </ul>
            </div>

            <CreatePortfolioModal
                isOpen={isCreatePortfolioModalOpen}
                onClose={() => setIsCreatePortfolioModalOpen(false)}
                onCreate={(name) => {
                    createPortfolio(name)
                    // Optionally navigate to portfolio page if not there, or force refresh if needed
                    if (!pathname.startsWith('/portfolio')) {
                        router.push('/portfolio')
                    }
                }}
            />
        </aside>
    )
}
