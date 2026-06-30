
import { getAllInstruments, getLatestNews } from "@/lib/data"
import { PortfolioClient } from "./client"

export default async function PortfolioPage() {
    const [stockData, news] = await Promise.all([
        getAllInstruments(),
        getLatestNews(20),
    ])
    return <PortfolioClient stockData={stockData} news={news} />
}
