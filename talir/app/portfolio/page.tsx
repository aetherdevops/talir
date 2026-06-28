
import { getAllInstruments } from "@/lib/data"
import { PortfolioClient } from "./client"

export default async function PortfolioPage() {
    const stockData = await getAllInstruments()
    return <PortfolioClient stockData={stockData} />
}
