export function AccentTopRule({ className }: { className?: string }) {
    return (
        <div
            className={
                className ??
                'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70'
            }
            aria-hidden
        />
    )
}
