// ... imports
import { useMemo } from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { formatPrice } from '@/lib/utils'
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
    // ... same as before
    const { root, depth, x, y, width, height, index, payload, colors, name, value, changePercent } = props;
    const safeChangePercent = typeof changePercent === 'number' ? changePercent : 0;

    // Determine color based on changePercent
    let fill = '#9ca3af' // Neutral gray
    if (safeChangePercent > 0) {
        // Green scale
        if (safeChangePercent > 3) fill = '#16a34a' // green-600
        else if (safeChangePercent > 1) fill = '#22c55e' // green-500
        else fill = '#4ade80' // green-400
    } else if (safeChangePercent < 0) {
        // Red scale
        if (safeChangePercent < -3) fill = '#dc2626' // red-600
        else if (safeChangePercent < -1) fill = '#ef4444' // red-500
        else fill = '#f87171' // red-400
    }

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
                        <span className="text-xs">{safeChangePercent.toFixed(2)}%</span>
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
            changePercent: h.changePercent || 0, // Ensure value exists
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
            <div className="flex items-center gap-4 text-xs mb-2">
                <span>Day change (%):</span>
                <div className="flex items-center gap-1">
                    <span className="w-4 h-4 bg-red-600 rounded-sm"></span> ≤-3
                    <span className="w-4 h-4 bg-red-500 rounded-sm"></span> -2
                    <span className="w-4 h-4 bg-red-400 rounded-sm"></span> -1
                    <span className="w-4 h-4 bg-gray-400 rounded-sm"></span> 0
                    <span className="w-4 h-4 bg-green-400 rounded-sm"></span> +1
                    <span className="w-4 h-4 bg-green-500 rounded-sm"></span> +2
                    <span className="w-4 h-4 bg-green-600 rounded-sm"></span> ≥3
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
                        fill="#8884d8"
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
                                            <div className={node.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                                                Change: {node.changePercent?.toFixed(2)}%
                                            </div>
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
