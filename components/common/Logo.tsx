import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export function Logo({ className }: { className?: string }) {
    return (
        <Link href="/" className={cn("flex items-center gap-4", className)}>
            <div className="relative w-14 h-14">
                <Image
                    src="/talir-app-logo.png"
                    alt="Talir Logo"
                    fill
                    className="object-contain dark:hidden"
                    sizes="56px"
                    priority
                />
                <Image
                    src="/talir-app-logo-dark.png"
                    alt="Talir Logo"
                    fill
                    className="object-contain hidden dark:block"
                    sizes="56px"
                    priority
                />
            </div>
            <span className="font-display text-3xl font-bold tracking-widest text-text-primary">
                Talir
            </span>
        </Link>
    )
}
