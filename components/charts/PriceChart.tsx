"use client"

import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { cn, formatPrice, formatInteger } from '@/lib/utils'
import { isDarkTheme } from '@/lib/theme'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ChartData {
    time: string
    value: number
    volume?: number
}

interface PriceChartProps {
    data: ChartData[]
    timeframe?: '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'
    onTimeframeChange?: (timeframe: '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX') => void
    prevClose?: number | null
    colors?: {
        upColor?: string
        downColor?: string
    }
    excludePeriods?: string[]
}

type TooltipState = {
    price: string
    date: string
    volume?: string
    left: number
    top: number
} | null

function readCssVar(name: string, fallback: string): string {
    if (typeof document === 'undefined') return fallback
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
}

function PriceChartComponent({ data, timeframe, onTimeframeChange, prevClose, excludePeriods = [] }: PriceChartProps) {
    const { t } = useLocale()
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

    const [isDarkMode, setIsDarkMode] = useState(isDarkTheme)
    const [localTimeframe, setLocalTimeframe] = useState<'1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'>('1Y')
    const [tooltip, setTooltip] = useState<TooltipState>(null)

    useEffect(() => {
        const checkDark = () => isDarkTheme()
        setIsDarkMode(checkDark())

        const observer = new MutationObserver(() => setIsDarkMode(checkDark()))
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
        return () => observer.disconnect()
    }, [])

    const effectiveTimeframe = timeframe || localTimeframe
    const handleTimeframeChange = (tf: (typeof effectiveTimeframe)) => {
        if (onTimeframeChange) onTimeframeChange(tf)
        else setLocalTimeframe(tf)
    }

    const isPositive = data.length > 1 ? data[data.length - 1].value >= data[0].value : true
    const chartColor = readCssVar(isPositive ? '--up' : '--down', isPositive ? '#1a7a47' : '#c2362f')
    const gridColor = readCssVar('--border', isDarkMode ? 'rgba(231, 217, 168, 0.14)' : 'rgba(15, 31, 56, 0.12)')
    const textColor = readCssVar('--text-tertiary', isDarkMode ? '#9fb0c9' : '#5a6577')
    const crosshairColor = readCssVar('--text-secondary', isDarkMode ? 'rgba(159, 176, 201, 0.6)' : 'rgba(90, 101, 119, 0.6)')
    const markerBorder = readCssVar('--surface', isDarkMode ? '#16294a' : '#fbfaf5')

    const hideTooltip = useCallback(() => setTooltip(null), [])

    useEffect(() => {
        if (!chartContainerRef.current) return
        if (chartContainerRef.current.clientWidth === 0) return

        const container = chartContainerRef.current

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: container.clientWidth })
            }
        }

        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor,
                fontFamily: 'var(--font-sans), Inter, sans-serif',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: gridColor, visible: true, style: 1 },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
                fixLeftEdge: true,
                fixRightEdge: true,
            },
            width: container.clientWidth,
            height: 400,
            autoSize: true,
            handleScale: {
                axisPressedMouseMove: { time: true, price: true },
                mouseWheel: true,
                pinch: true,
            },
            handleScroll: {
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
                mouseWheel: true,
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    width: 1,
                    color: crosshairColor,
                    style: 3,
                    labelVisible: false,
                },
                horzLine: {
                    visible: false,
                    labelVisible: true,
                },
            },
        })

        const newSeries = chart.addAreaSeries({
            lineColor: chartColor,
            topColor: `${chartColor}33`,
            bottomColor: `${chartColor}00`,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: markerBorder,
            crosshairMarkerBackgroundColor: chartColor,
        })

        newSeries.setData(
            data.map((d) => ({
                time: d.time as Time,
                value: d.value,
            }))
        )

        if (data.length > 0) {
            const lastItem = data[data.length - 1]
            newSeries.setMarkers([
                {
                    time: lastItem.time as Time,
                    position: 'inBar',
                    color: chartColor,
                    shape: 'circle',
                    size: 1,
                },
            ])
        }

        chart.timeScale().fitContent()

        chart.subscribeCrosshairMove((param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > container.clientWidth ||
                param.point.y < 0 ||
                param.point.y > container.clientHeight
            ) {
                hideTooltip()
                return
            }

            const dataPoint = param.seriesData.get(newSeries) as { value: number; time: Time } | undefined
            if (!dataPoint) {
                hideTooltip()
                return
            }

            const fullData = data.find((d) => d.time === (dataPoint.time as unknown as string))
            const dateStr = new Date(dataPoint.time as unknown as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })

            const toolTipWidth = 120
            const toolTipHeight = 80
            const toolTipMargin = 15

            let left = param.point.x + toolTipMargin
            if (left + toolTipWidth > container.clientWidth) {
                left = param.point.x - toolTipWidth - toolTipMargin
            }

            let top = param.point.y - toolTipMargin
            if (top + toolTipHeight > container.clientHeight) {
                top = param.point.y - toolTipHeight - toolTipMargin
            }

            setTooltip({
                price: formatPrice(dataPoint.value),
                date: dateStr,
                volume: fullData?.volume
                    ? `${t('markets.volumeAbbr')} ${formatInteger(fullData.volume)}`
                    : undefined,
                left,
                top,
            })
        })

        chartRef.current = chart
        seriesRef.current = newSeries

        const resizeObserver = new ResizeObserver(() => handleResize())
        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
            chartRef.current = null
            hideTooltip()
        }
    }, [data, isDarkMode, chartColor, gridColor, textColor, crosshairColor, markerBorder, hideTooltip, t])

    return (
        <div className="flex flex-col gap-4 w-full min-w-0">
            <div className="relative w-full min-w-0" style={{ height: 400 }}>
                <div className="h-[400px] w-full touch-pan-x" ref={chartContainerRef} />
                {tooltip && (
                    <div
                        className="absolute p-3 bg-surface border border-border rounded-lg shadow-xl pointer-events-none z-50"
                        style={{ left: tooltip.left, top: tooltip.top, minWidth: 100 }}
                    >
                        <div className="text-sm font-bold text-text-primary font-data whitespace-nowrap">
                            {tooltip.price}
                        </div>
                        <div className="text-xs text-text-tertiary font-data whitespace-nowrap">{tooltip.date}</div>
                        {tooltip.volume ? (
                            <div className="text-xs text-text-tertiary font-data whitespace-nowrap mt-0.5">
                                {tooltip.volume}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {prevClose != null && prevClose > 0 ? (
                <p className="text-xs font-data text-text-muted tabular-nums pl-2 md:pl-0">
                    {t('stock.prevClose')} {formatPrice(prevClose)}
                </p>
            ) : null}

            <div className="pl-2 md:pl-0 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                <div className="flex justify-start gap-1 flex-nowrap min-w-max">
                    {(['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'MAX'] as const)
                        .filter((tf) => !excludePeriods.includes(tf))
                        .map((tf) => (
                            <button
                                key={tf}
                                type="button"
                                onClick={() => handleTimeframeChange(tf)}
                                className={cn(
                                    'shrink-0 px-2 md:px-2.5 py-1.5 text-[11px] md:text-xs font-bold rounded-lg transition-colors min-h-[36px] min-w-[36px]',
                                    effectiveTimeframe === tf
                                        ? 'bg-accent-muted text-accent border border-accent/20'
                                        : 'text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary'
                                )}
                            >
                                {tf}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    )
}

export const PriceChart = memo(PriceChartComponent)
