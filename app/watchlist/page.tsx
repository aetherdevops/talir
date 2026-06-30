
import { getAllInstruments, getLatestNews } from "@/lib/data"
import { WatchlistClient } from "./client"

export default async function WatchlistPage() {
    const [stockData, news] = await Promise.all([
        getAllInstruments(),
        getLatestNews(20),
    ])
    return <WatchlistClient stockData={stockData} news={news} />
}
