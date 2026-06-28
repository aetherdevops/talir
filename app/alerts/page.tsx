import { AlertsClient } from './client'

export const metadata = {
    title: 'My Alerts - Talir',
    description: 'Manage your stock price alerts',
}

export default function AlertsPage() {
    return (
        <AlertsClient />
    )
}
