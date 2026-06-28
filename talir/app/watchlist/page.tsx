
import { getAllInstruments } from "@/lib/data"
import { WatchlistClient } from "./client"

export default async function WatchlistPage() {
    const stockData = await getAllInstruments()
    return <WatchlistClient stockData={stockData} />
}
