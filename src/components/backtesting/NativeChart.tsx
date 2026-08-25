import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  LineStyle,
  UTCTimestamp,
  CrosshairMode,
  ColorType,
} from 'lightweight-charts';
import { OHLCVData } from '../../types/ohlcv';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface NativeChartProps {
  data: OHLCVData[];
  symbol?: string;
  timeframe?: string;
  decimals?: number;
  theme?: 'dark' | 'light' | 'liquid';
  showVolume?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCrosshairMove?: (candle: OHLCVData | null) => void;
  className?: string;
}

export const NativeChart: React.FC<NativeChartProps> = ({
  data,
  symbol = 'XAUUSD',
  timeframe = '15m',
  decimals = 2,
  theme = 'liquid',
  showVolume = true,
  isLoading = false,
  error = null,
  onRetry,
  onCrosshairMove,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick', UTCTimestamp> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', UTCTimestamp> | null>(null);
  const hasFittedRef = useRef<boolean>(false);

  const [hoveredCandle, setHoveredCandle] = useState<OHLCVData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(showVolume);

  // Reset fitted flag when symbol or timeframe changes
  useEffect(() => {
    hasFittedRef.current = false;
  }, [symbol, timeframe]);

  // Latest candle fallback when crosshair is not active
  const latestCandle = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1];
  }, [data]);

  const activeCandle = hoveredCandle || latestCandle;

  // Chart theme configuration
  const isDark = theme !== 'light';
  const chartTheme = useMemo(() => {
    return {
      bg: isDark ? '#090d16' : '#ffffff',
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(226, 232, 240, 0.8)',
      borderColor: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.8)',
      crosshairColor: isDark ? '#64748b' : '#94a3b8',
      upColor: '#10b981',
      downColor: '#f43f5e',
      upVolumeColor: 'rgba(16, 185, 129, 0.45)',
      downVolumeColor: 'rgba(244, 63, 94, 0.45)',
    };
  }, [isDark]);

  // Format timestamp to human readable date string
  const formatTime = useCallback((timestampSec: number) => {
    if (!timestampSec) return '';
    const date = new Date(timestampSec * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, []);

  // Initialize and configure Lightweight Charts engine
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.bg },
        textColor: chartTheme.textColor,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
      },
      grid: {
        vertLines: { color: chartTheme.gridColor },
        horzLines: { color: chartTheme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: chartTheme.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      rightPriceScale: {
        borderColor: chartTheme.borderColor,
        autoScale: true,
        scaleMargins: {
          top: 0.08,
          bottom: isVolumeVisible ? 0.22 : 0.08,
        },
      },
      timeScale: {
        borderColor: chartTheme.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 1.5,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // 1. Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartTheme.upColor,
      downColor: chartTheme.downColor,
      borderVisible: true,
      borderUpColor: chartTheme.upColor,
      borderDownColor: chartTheme.downColor,
      wickUpColor: chartTheme.upColor,
      wickDownColor: chartTheme.downColor,
      priceFormat: {
        type: 'price',
        precision: decimals,
        minMove: 1 / Math.pow(10, decimals),
      },
    });
    candleSeriesRef.current = candleSeries;

    // 2. Add Volume Histogram Series overlay pinned at bottom
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay on price scale
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. Crosshair move listener for interactive OHLC tooltips
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredCandle(null);
        if (onCrosshairMove) onCrosshairMove(null);
        return;
      }

      const barData = param.seriesData.get(candleSeries) as {
        time: UTCTimestamp;
        open: number;
        high: number;
        low: number;
        close: number;
      } | undefined;

      if (barData) {
        const volData = volumeSeriesRef.current
          ? (param.seriesData.get(volumeSeriesRef.current) as { value: number } | undefined)
          : undefined;

        const candleInfo: OHLCVData = {
          time: Number(barData.time),
          open: barData.open,
          high: barData.high,
          low: barData.low,
          close: barData.close,
          volume: volData ? volData.value : 0,
        };

        setHoveredCandle(candleInfo);
        if (onCrosshairMove) onCrosshairMove(candleInfo);
      } else {
        setHoveredCandle(null);
        if (onCrosshairMove) onCrosshairMove(null);
      }
    });

    // Populate initial data if present
    if (data && data.length > 0) {
      const candleFormatted = data.map(d => ({
        time: Math.floor(d.time > 1e11 ? d.time / 1000 : d.time) as UTCTimestamp,
        open: Number(d.open),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
      }));

      const candleMap = new Map<number, (typeof candleFormatted)[0]>();
      candleFormatted.forEach(c => {
        if (c.time > 0 && !isNaN(c.open) && !isNaN(c.close)) {
          candleMap.set(c.time as number, c);
        }
      });
      const sortedCandles = Array.from(candleMap.values()).sort(
        (a, b) => (a.time as number) - (b.time as number)
      );

      candleSeries.setData(sortedCandles);

      if (isVolumeVisible) {
        const volumeFormatted = data.map(d => ({
          time: Math.floor(d.time > 1e11 ? d.time / 1000 : d.time) as UTCTimestamp,
          value: Number(d.volume || 0),
          color: d.close >= d.open ? chartTheme.upVolumeColor : chartTheme.downVolumeColor,
        }));
        const volMap = new Map<number, (typeof volumeFormatted)[0]>();
        volumeFormatted.forEach(v => {
          if (v.time > 0) volMap.set(v.time as number, v);
        });
        const sortedVol = Array.from(volMap.values()).sort(
          (a, b) => (a.time as number) - (b.time as number)
        );
        volumeSeries.setData(sortedVol);
      }

      chart.timeScale().fitContent();
      hasFittedRef.current = true;
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [theme, decimals]);

  // Update data dynamically when series data changes
  useEffect(() => {
    if (!candleSeriesRef.current || !data) return;

    const candleFormatted = data.map(d => ({
      time: Math.floor(d.time > 1e11 ? d.time / 1000 : d.time) as UTCTimestamp,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
    }));

    const candleMap = new Map<number, (typeof candleFormatted)[0]>();
    candleFormatted.forEach(c => {
      if (c.time > 0 && !isNaN(c.open) && !isNaN(c.close)) {
        candleMap.set(c.time as number, c);
      }
    });
    const sortedCandles = Array.from(candleMap.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );

    candleSeriesRef.current.setData(sortedCandles);

    if (volumeSeriesRef.current) {
      if (isVolumeVisible) {
        const volumeFormatted = data.map(d => ({
          time: Math.floor(d.time > 1e11 ? d.time / 1000 : d.time) as UTCTimestamp,
          value: Number(d.volume || 0),
          color: d.close >= d.open ? chartTheme.upVolumeColor : chartTheme.downVolumeColor,
        }));
        const volMap = new Map<number, (typeof volumeFormatted)[0]>();
        volumeFormatted.forEach(v => {
          if (v.time > 0) volMap.set(v.time as number, v);
        });
        const sortedVol = Array.from(volMap.values()).sort(
          (a, b) => (a.time as number) - (b.time as number)
        );
        volumeSeriesRef.current.setData(sortedVol);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    if (chartRef.current && sortedCandles.length > 0 && !hasFittedRef.current) {
      chartRef.current.timeScale().fitContent();
      hasFittedRef.current = true;
    }
  }, [data, isVolumeVisible, chartTheme]);

  // Toggle Volume Visibility
  const handleToggleVolume = () => {
    setIsVolumeVisible(prev => !prev);
  };

  // Reset Zoom & Fit to Content
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  // Price change calculations
  const priceChange = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const priceChangePercent = activeCandle && activeCandle.open > 0 ? (priceChange / activeCandle.open) * 100 : 0;
  const isBullish = priceChange >= 0;

  return (
    <div
      className={`relative w-full h-full rounded-2xl border overflow-hidden flex flex-col transition-all select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-3' : ''
      } ${
        theme === 'liquid'
          ? 'bg-slate-950/80 border-slate-700/60 backdrop-blur-xl shadow-2xl'
          : theme === 'dark'
          ? 'bg-slate-950 border-slate-800 shadow-xl'
          : 'bg-white border-slate-200 shadow-md'
      } ${className}`}
    >
      {/* Dynamic Hover/Active OHLC Bar Ribbon */}
      <div className="absolute top-3 left-3.5 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Symbol & Timeframe badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-md">
          <span className="font-mono font-black text-xs text-white tracking-wide">{symbol}</span>
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
            {timeframe}
          </span>
          {activeCandle && (
            <span className="text-[10px] text-slate-400 font-mono ml-1">
              {formatTime(activeCandle.time)}
            </span>
          )}
        </div>

        {/* OHLCV metrics */}
        {activeCandle && (
          <div className="flex flex-wrap items-center gap-2.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 shadow-md backdrop-blur-md font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">O:</span>
              <span className="text-white font-bold">{activeCandle.open.toFixed(decimals)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">H:</span>
              <span className="text-emerald-400 font-bold">{activeCandle.high.toFixed(decimals)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">L:</span>
              <span className="text-rose-400 font-bold">{activeCandle.low.toFixed(decimals)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-semibold">C:</span>
              <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {activeCandle.close.toFixed(decimals)}
              </span>
            </div>
            {isVolumeVisible && activeCandle.volume > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-semibold">V:</span>
                <span className="text-indigo-300 font-medium">{activeCandle.volume.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              <span className={`font-bold flex items-center gap-0.5 ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isBullish ? '+' : ''}
                {priceChange.toFixed(decimals)} ({isBullish ? '+' : ''}
                {priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chart Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {isLoading && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-mono backdrop-blur-md shadow-md animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="text-[10px] font-semibold hidden sm:inline">Syncing Feed...</span>
          </div>
        )}

        <button
          onClick={handleToggleVolume}
          className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1 backdrop-blur-md shadow-md ${
            isVolumeVisible
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-white'
          }`}
          title="Toggle Volume Bars"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">Vol</span>
        </button>

        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer backdrop-blur-md shadow-md"
          title="Reset Zoom / Fit to Window"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer backdrop-blur-md shadow-md"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Chart'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (!data || data.length === 0) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <div className="text-center font-mono">
            <p className="text-sm font-bold text-white">Loading {symbol} ({timeframe}) Market Data</p>
            <p className="text-xs text-slate-400 mt-0.5">Fetching institutional historical candles...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (!data || data.length === 0) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md gap-3 p-6 text-center">
          <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <p className="text-sm font-bold text-white">Market Data Error</p>
            <p className="text-xs text-rose-300/80 mt-1 font-mono">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Market Feed</span>
            </button>
          )}
        </div>
      )}

      {/* Primary Lightweight Chart Canvas Mount Point */}
      <div ref={containerRef} className="flex-1 w-full h-full min-h-[300px]" />
    </div>
  );
};
