import { getMbi10Codes } from '@/lib/index-constituents'

/** Comma-separated allowlist in TALIR_ADMIN_EMAILS (case-insensitive). */
export function getAdminEmails(): string[] {
    return (process.env.TALIR_ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false
    const allow = getAdminEmails()
    if (!allow.length) return false
    return allow.includes(email.trim().toLowerCase())
}

export function adminMbi10Codes(): string[] {
    return getMbi10Codes().map((c) => c.toUpperCase())
}
