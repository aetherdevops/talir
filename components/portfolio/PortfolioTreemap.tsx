// ... imports
import { useMemo } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { formatPrice, formatPriceChange, getChangeTreemapFill } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { Modal } from "@/components/ui/Modal"

interface PortfolioTreemapProps {
    isOpen: boolean
    onClose: () => void
    holdings: {
        code: string
        stockName: string
        marketValue: number
        changePercent: number
    }[]
}

const CustomContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, name, value, changePercent } = props;
    const safeChangePercent = typeof changePercent === 'number' ? changePercent : 0;
    const fill = getChangeTreemapFill(safeChangePercent)

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: fill,
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 50 && height > 50 ? (
                <foreignObject x={x} y={y} width={width} height={height}>
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-1 text-center overflow-hidden">
                        <span className="text-sm font-bold truncate w-full">{name}</span>
                        <span className="text-xs font-data">{formatPriceChange(safeChangePercent)}</span>
                    </div>
                </foreignObject>
            ) : null}
        </g>
    );
}

export function PortfolioTreemap({ isOpen, onClose, holdings }: PortfolioTreemapProps) {
    const data = useMemo(() => {
        return holdings.map(h => ({
            name: h.code,
            size: h.marketValue,
            changePercent: h.changePercent || 0,
            fullData: h
        })).sort((a, b) => b.size - a.size)
    }, [holdings])

    const treeMapData = [{
        name: 'Portfolio',
        children: data
    }]

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Your investments visualized"
            className="max-w-5xl h-[80vh] flex flex-col"
        >
            <div className="flex items-center gap-4 text-xs mb-2 font-data text-text-secondary">
                <span>Day change (%):</span>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-down" /> down</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-neutral" /> flat</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-up" /> up</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        width={400}
                        height={200}
                        data={data.length > 0 ? treeMapData : []}
                        dataKey="size"
                        stroke="#fff"
                        fill="#5a6577"
                        content={<CustomContent />}
                    >
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const node = payload[0].payload;
                                    return (
                                        <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-md border text-xs">
                                            <div className="font-bold">{node.name}</div>
                                            <div>Value: {formatPrice(node.size)}</div>
                                            <ChangeLabel change={node.changePercent} className="text-xs" />
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                    </Treemap>
                </ResponsiveContainer>
            </div>
        </Modal>
    )
}
