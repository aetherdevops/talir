import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
    return new Intl.NumberFormat('mk-MK', {
        style: 'currency',
        currency: 'MKD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price)
}

export function formatPriceChange(change: number) {
    if (change === 0) return "0.00%"
    return (change > 0 ? "+" : "") + change.toFixed(2) + "%"
}
