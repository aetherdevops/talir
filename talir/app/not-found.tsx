import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { FileQuestion, Rocket } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center text-center animate-fade-in font-sans">
            <div className="relative mb-8">
                <div className="absolute inset-0 animate-pulse rounded-full bg-brand-500/20 blur-xl"></div>
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-surface-secondary dark:bg-dark-elevated shadow-lg">
                    <FileQuestion className="h-16 w-16 text-brand-600 dark:text-brand-400" />
                </div>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-text-primary mb-3">Page Not Found</h2>
            <p className="text-text-secondary max-w-md mb-8 leading-relaxed">
                We couldn&apos;t find the market data you&apos;re looking for. It might have been delisted or moved to another exchange.
            </p>

            <div className="flex gap-4">
                <Link href="/">
                    <Button size="lg" className="rounded-full px-8 shadow-lg shadow-brand-500/20">
                        Return Home
                    </Button>
                </Link>
                <Link href="/markets">
                    <Button variant="secondary" size="lg" className="rounded-full px-8">
                        Explore Markets
                    </Button>
                </Link>
            </div>
        </div>
    )
}
