"use client"

import { useEffect, useRef, useState, memo } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/lib/store'

interface ChartData {
    time: string
    value: number
    volume?: number
}

interface PriceChartProps {
    data: ChartData[]
    timeframe?: '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'
    onTimeframeChange?: (timeframe: '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX') => void
    colors?: {
        upColor?: string
        downColor?: string
    }
    excludePeriods?: string[]
}

function PriceChartComponent({ data, timeframe, onTimeframeChange, excludePeriods = [] }: PriceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
    const { theme } = useThemeStore() // Assuming we have access to theme state
    // Or simpler: check document class for 'dark'

    const [isDarkMode, setIsDarkMode] = useState(false)
    const [localTimeframe, setLocalTimeframe] = useState<'1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'>('1Y')

    // Detect dark mode initially and on change
    useEffect(() => {
        const checkDark = () => document.documentElement.classList.contains('dark')
        setIsDarkMode(checkDark())

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDarkMode(checkDark())
                }
            })
        })

        observer.observe(document.documentElement, { attributes: true })
        return () => observer.disconnect()
    }, [])

    // Effective values (Controlled or Uncontrolled fallback)
    const effectiveTimeframe = timeframe || localTimeframe
    const handleTimeframeChange = (tf: any) => {
        if (onTimeframeChange) {
            onTimeframeChange(tf)
        } else {
            setLocalTimeframe(tf)
        }
    }

    // Filter Logic - Only apply if Uncontrolled OR if Parent assumes PriceChart does the filtering.
    // However, StockClient passes PRE-FILTERED data.
    // We should differentiate. If StockClient does the filtering, 'data' is already correct.
    // If 'data' is 60+ points, we display it.
    // The previous implementation FILTERED inside PriceChart.
    // If we want to support both, we need to know if we should filter.
    // But simplicity: StockClient passes filtered data. PriceChart just renders.
    // BUT wait, PriceChart used to do filtering based on 'timeframe'.
    // If we pass 'filteredData' from StockClient, PriceChart shouldn't filter again.
    // Let's assume 'data' is WHAT TO RENDER.

    // Determine trend color based on data start/end
    const isPositive = data.length > 2
        ? data[data.length - 1].value >= data[0].value
        : true

    const chartColor = isPositive ? '#10b981' : '#ef4444' // emerald-500 : red-500

    // Tooltip State
    const toolTipRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!chartContainerRef.current) return

        // Wait for container to have dimensions
        if (chartContainerRef.current.clientWidth === 0) return

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
            }
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDarkMode ? '#9ca3af' : '#6b7280',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: isDarkMode ? '#374151' : '#e5e7eb', visible: true, style: 1 }, // Solid but subtle
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            autoSize: true,
            handleScale: false,
            handleScroll: false,
            crosshair: {
                vertLine: {
                    width: 1,
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    style: 3,
                    labelVisible: false,
                },
                horzLine: {
                    visible: false,
                    labelVisible: true, // Show price label on crosshair
                },
            },
        })

        // Add Area Series
        const newSeries = chart.addAreaSeries({
            lineColor: chartColor,
            topColor: chartColor + '20', // Very light fill
            bottomColor: chartColor + '00',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: isDarkMode ? '#000000' : '#ffffff',
            crosshairMarkerBackgroundColor: chartColor,
        })

        newSeries.setData(data.map(d => ({
            time: d.time as Time,
            value: d.value
        })))

        // LAST POINT MARKER (Google Finance Style)
        if (data.length > 0) {
            const lastItem = data[data.length - 1];
            newSeries.setMarkers([
                {
                    time: lastItem.time as Time,
                    position: 'inBar',
                    color: chartColor,
                    shape: 'circle',
                    size: 1, // Determines size relative to bar width?, no, it's abstract
                    text: undefined,
                }
            ]);
            // Note: lightweight-charts markers are fixed shapes. 
            // 'circle' is standard. 'size' logic varies. 
            // If we want a specific "dot on the line", a small circle marker at the end works.
        }

        // Ensure we zoom out to fit all data
        chart.timeScale().fitContent()

        // Tooltip Logic
        chart.subscribeCrosshairMove(param => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                if (toolTipRef.current) {
                    toolTipRef.current.style.display = 'none';
                }
            } else {
                if (toolTipRef.current) {
                    toolTipRef.current.style.display = 'block';

                    const dataPoint = param.seriesData.get(newSeries) as { value: number, time: Time } | undefined;
                    if (dataPoint) {
                        // Find full data object to get volume if available
                        const fullData = data.find(d => d.time === dataPoint.time as unknown as string)

                        const dateStr = new Date(dataPoint.time as unknown as string).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })

                        const priceStr = `MKD ${dataPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        const volumeStr = fullData?.volume ? `Vol: ${fullData.volume.toLocaleString()}` : ''

                        toolTipRef.current.innerHTML = `
                            <div class="text-sm font-bold text-text-primary whitespace-nowrap">${priceStr}</div>
                            <div class="text-xs text-text-tertiary whitespace-nowrap">${dateStr}</div>
                            ${volumeStr ? `<div class="text-xs text-text-tertiary whitespace-nowrap mt-0.5">${volumeStr}</div>` : ''}
                        `;

                        // Position logic
                        const toolTipWidth = 120; // Avg width
                        const toolTipHeight = 80; // Avg height
                        const toolTipMargin = 15;

                        let left = param.point.x + toolTipMargin;
                        if (left + toolTipWidth > chartContainerRef.current!.clientWidth) {
                            left = param.point.x - toolTipWidth - toolTipMargin;
                        }

                        let top = param.point.y - toolTipMargin;
                        if (top + toolTipHeight > chartContainerRef.current!.clientHeight) {
                            top = param.point.y - toolTipHeight - toolTipMargin;
                        }

                        toolTipRef.current.style.left = left + 'px';
                        toolTipRef.current.style.top = top + 'px';
                    }
                }
            }
        });

        chartRef.current = chart
        seriesRef.current = newSeries

        const resizeObserver = new ResizeObserver(() => handleResize())
        resizeObserver.observe(chartContainerRef.current)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
            chartRef.current = null
        }
    }, [data, isDarkMode, chartColor])

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="relative w-full">
                <div className="h-[400px] w-full" ref={chartContainerRef} />
                <div
                    ref={toolTipRef}
                    className="absolute hidden p-3 bg-surface border border-border rounded-lg shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: 0,
                        left: 0,
                        minWidth: '100px',
                    }}
                />
            </div>

            <div className="flex justify-start gap-1 flex-wrap pl-2 md:pl-0">
                {(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const)
                    .filter(tf => !excludePeriods.includes(tf))
                    .map((tf) => (
                        <button
                            key={tf}
                            onClick={() => handleTimeframeChange(tf)}
                            className={cn(
                                "px-3 py-1 text-xs font-bold rounded-full transition-all",
                                effectiveTimeframe === tf
                                    ? "bg-brand-active text-brand-text shadow-sm"
                                    : "text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
            </div>
        </div>
    )
}

export const PriceChart = memo(PriceChartComponent)
