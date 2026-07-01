import { ChangeLabel } from '@/components/ui/ChangeLabel'

/** @deprecated Use ChangeLabel from @/components/ui/ChangeLabel */
export function PeriodChangeLabel(props: { change: number; className?: string }) {
    return <ChangeLabel {...props} variant="inline" />
}
