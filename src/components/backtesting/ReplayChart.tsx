import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  createSeriesMarkers,
  LineStyle,
  UTCTimestamp,
  SeriesMarker,
  ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import {
  ReplayCandle,
  ReplayPosition,
  ReplayTrade,
  IndicatorVisibility,
  TimeframeId,
} from './types';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
} from './indicatorCalculations';
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  TrendingUp,
  Activity,
  Layers,
  Settings2,
  Crosshair,
  BarChart2,
} from 'lucide-react';

interface ReplayChartProps {
  candles: ReplayCandle[];
  symbol: string;
  timeframe: TimeframeId;
  positions: ReplayPosition[];
  trades: ReplayTrade[];
  theme: 'dark' | 'light' | 'glass';
  indicators: IndicatorVisibility;
  onToggleIndicator: (key: keyof IndicatorVisibility) => void;
  decimals?: number;
}

export const ReplayChart: React.FC<ReplayChartProps> = ({
  candles,
  symbol,
  timeframe,
  positions,
  trades,
  theme,
  indicators,
  onToggleIndicator,
  decimals = 5,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick', any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram', any> | null>(null);
  const seriesMarkersPluginRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);

  // Indicator series refs
  const ema9Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const ema20Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const ema50Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const ema200Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const sma20Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const sma50Ref = useRef<ISeriesApi<'Line', any> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line', any> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line', any> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<'Line', any> | null>(null);

  // Price lines for SL / TP / Entry
  const priceLinesRef = useRef<IPriceLine[]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIndicatorsDropdown, setShowIndicatorsDropdown] = useState(false);
  const [hoveredData, setHoveredData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeString: string;
  } | null>(null);

  // Theme colors
  const isDark = theme !== 'light';
  const chartTheme = useMemo(() => {
    return {
      bg: isDark ? '#0b0f17' : '#ffffff',
      text: isDark ? '#94a3b8' : '#475569',
      grid: isDark ? '#1e293b40' : '#f1f5f9',
      border: isDark ? '#334155' : '#cbd5e1',
      upCandle: '#10b981',
      downCandle: '#f43f5e',
      crosshair: isDark ? '#64748b' : '#94a3b8',
    };
  }, [isDark]);

  // Indicator series values calculated deterministically
  const ema9Data = useMemo(() => calculateEMA(candles, 9), [candles]);
  const ema20Data = useMemo(() => calculateEMA(candles, 20), [candles]);
  const ema50Data = useMemo(() => calculateEMA(candles, 50), [candles]);
  const ema200Data = useMemo(() => calculateEMA(candles, 200), [candles]);
  const sma20Data = useMemo(() => calculateSMA(candles, 20), [candles]);
  const sma50Data = useMemo(() => calculateSMA(candles, 50), [candles]);
  const bbData = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsiData = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macdData = useMemo(() => calculateMACD(candles), [candles]);

  const latestRsi = rsiData && rsiData.length > 0 ? rsiData[rsiData.length - 1].value : 50;
  const latestMacdPoint = macdData && macdData.length > 0 ? macdData[macdData.length - 1] : null;
  const latestMacd = latestMacdPoint ? latestMacdPoint.macd : 0;
  const latestSignal = latestMacdPoint ? latestMacdPoint.signal : 0;
  const latestHist = latestMacdPoint ? latestMacdPoint.histogram : 0;

  // Initialize Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 460,
      layout: {
        background: { color: chartTheme.bg },
        textColor: chartTheme.text,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: chartTheme.grid },
        horzLines: { color: chartTheme.grid },
      },
      crosshair: {
        vertLine: {
          color: chartTheme.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0',
        },
        horzLine: {
          color: chartTheme.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: isDark ? '#1e293b' : '#e2e8f0',
        },
      },
      rightPriceScale: {
        borderColor: chartTheme.border,
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.18,
        },
      },
      timeScale: {
        borderColor: chartTheme.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 2,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartTheme.upCandle,
      downColor: chartTheme.downCandle,
      borderVisible: true,
      borderUpColor: chartTheme.upCandle,
      borderDownColor: chartTheme.downCandle,
      wickUpColor: chartTheme.upCandle,
      wickDownColor: chartTheme.downCandle,
      priceFormat: {
        type: 'price',
        precision: decimals,
        minMove: 1 / Math.pow(10, decimals),
      },
    });
    candlestickSeriesRef.current = candleSeries;

    // Initialize Markers plugin
    seriesMarkersPluginRef.current = createSeriesMarkers(candleSeries, []);

    // 2. Volume Series (bottom pinned histogram)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: '#6366f1',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // 3. Indicator series
    ema9Ref.current = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    ema20Ref.current = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    ema50Ref.current = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    ema200Ref.current = chart.addSeries(LineSeries, {
      color: '#ec4899',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    sma20Ref.current = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 1,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    sma50Ref.current = chart.addSeries(LineSeries, {
      color: '#10b981',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });

    bbUpperRef.current = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
    });

    bbLowerRef.current = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
    });

    bbMiddleRef.current = chart.addSeries(LineSeries, {
      color: '#c084fc',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });

    // Crosshair tooltip tracking
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredData(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries) as any;
      const volData = volumeSeriesRef.current
        ? (param.seriesData.get(volumeSeriesRef.current) as any)
        : null;

      if (candleData) {
        const found = candles.find(c => c.time === param.time);
        setHoveredData({
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData ? volData.value : 0,
          timeString: found ? found.timeString : new Date((param.time as number) * 1000).toLocaleString(),
        });
      } else {
        setHoveredData(null);
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartTheme, decimals]);

  // Update Data & Indicators
  useEffect(() => {
    if (!candlestickSeriesRef.current || candles.length === 0) return;

    // 1. Candlestick & Volume Data
    const formattedCandles = candles.map(c => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const formattedVolume = candles.map(c => ({
      time: c.time as UTCTimestamp,
      value: c.volume,
      color: c.close >= c.open ? '#10b98135' : '#f43f5e35',
    }));

    candlestickSeriesRef.current.setData(formattedCandles);

    if (volumeSeriesRef.current) {
      if (indicators.volume) {
        volumeSeriesRef.current.setData(formattedVolume);
      } else {
        volumeSeriesRef.current.setData([]);
      }
    }

    // 2. Indicators setData
    if (ema9Ref.current) {
      ema9Ref.current.setData(
        indicators.ema9 ? ema9Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }
    if (ema20Ref.current) {
      ema20Ref.current.setData(
        indicators.ema20 ? ema20Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }
    if (ema50Ref.current) {
      ema50Ref.current.setData(
        indicators.ema50 ? ema50Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }
    if (ema200Ref.current) {
      ema200Ref.current.setData(
        indicators.ema200 ? ema200Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }
    if (sma20Ref.current) {
      sma20Ref.current.setData(
        indicators.sma20 ? sma20Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }
    if (sma50Ref.current) {
      sma50Ref.current.setData(
        indicators.sma50 ? sma50Data.map(d => ({ time: d.time as UTCTimestamp, value: d.value })) : []
      );
    }

    if (bbUpperRef.current && bbLowerRef.current && bbMiddleRef.current) {
      if (indicators.bollinger) {
        bbUpperRef.current.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.upper })));
        bbLowerRef.current.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.lower })));
        bbMiddleRef.current.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.middle })));
      } else {
        bbUpperRef.current.setData([]);
        bbLowerRef.current.setData([]);
        bbMiddleRef.current.setData([]);
      }
    }
  }, [
    candles,
    indicators,
    ema9Data,
    ema20Data,
    ema50Data,
    ema200Data,
    sma20Data,
    sma50Data,
    bbData,
  ]);

  // Update Position Price Lines & Markers
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;
    const series = candlestickSeriesRef.current;

    // Clear old price lines
    priceLinesRef.current.forEach(line => series.removePriceLine(line));
    priceLinesRef.current = [];

    // Draw active position lines
    positions.forEach(pos => {
      // Entry Line
      const entryLine = series.createPriceLine({
        price: pos.entryPrice,
        color: pos.direction === 'BUY' ? '#10b981' : '#f43f5e',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `${pos.direction} @ ${pos.entryPrice}`,
      });
      priceLinesRef.current.push(entryLine);

      // Stop Loss Line
      if (pos.stopLoss) {
        const slLine = series.createPriceLine({
          price: pos.stopLoss,
          color: '#ef4444',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL: ${pos.stopLoss}`,
        });
        priceLinesRef.current.push(slLine);
      }

      // Take Profit Line
      if (pos.takeProfit) {
        const tpLine = series.createPriceLine({
          price: pos.takeProfit,
          color: '#22c55e',
          lineWidth: 1.5,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP: ${pos.takeProfit}`,
        });
        priceLinesRef.current.push(tpLine);
      }
    });

    // Markers for executions and closes
    const markers: SeriesMarker<any>[] = [];

    positions.forEach(pos => {
      markers.push({
        time: pos.openTime as UTCTimestamp,
        position: pos.direction === 'BUY' ? 'belowBar' : 'aboveBar',
        color: pos.direction === 'BUY' ? '#10b981' : '#f43f5e',
        shape: pos.direction === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${pos.direction} ${pos.lotSize}L`,
      });
    });

    trades.forEach(trade => {
      // Open marker
      markers.push({
        time: trade.openTime as UTCTimestamp,
        position: trade.direction === 'BUY' ? 'belowBar' : 'aboveBar',
        color: trade.direction === 'BUY' ? '#10b981' : '#f43f5e',
        shape: trade.direction === 'BUY' ? 'arrowUp' : 'arrowDown',
        text: `${trade.direction}`,
      });

      // Close marker
      markers.push({
        time: trade.closeTime as UTCTimestamp,
        position: trade.direction === 'BUY' ? 'aboveBar' : 'belowBar',
        color: trade.realizedPnl >= 0 ? '#10b981' : '#f43f5e',
        shape: 'circle',
        text: `${trade.exitReason} (${trade.realizedPnl >= 0 ? '+' : ''}$${trade.realizedPnl.toFixed(0)})`,
      });
    });

    // Sort markers by time
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    if (seriesMarkersPluginRef.current) {
      seriesMarkersPluginRef.current.setMarkers(markers);
    }
  }, [positions, trades]);

  const latestCandle = candles[candles.length - 1];
  const displayOhlc = hoveredData || (latestCandle ? {
    open: latestCandle.open,
    high: latestCandle.high,
    low: latestCandle.low,
    close: latestCandle.close,
    volume: latestCandle.volume,
    timeString: latestCandle.timeString,
  } : null);

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl border border-slate-800/90 bg-slate-950/90 overflow-hidden shadow-2xl backdrop-blur-sm ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-3xl' : ''
      }`}
    >
      {/* Top Header Bar inside Chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 text-xs">
        {/* Left: Instrument & Live Price */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-white">{symbol}</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">
              {timeframe}
            </span>
          </div>

          {displayOhlc && (
            <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span>
                O: <strong className="text-slate-200">{displayOhlc.open.toFixed(decimals)}</strong>
              </span>
              <span>
                H: <strong className="text-emerald-400">{displayOhlc.high.toFixed(decimals)}</strong>
              </span>
              <span>
                L: <strong className="text-rose-400">{displayOhlc.low.toFixed(decimals)}</strong>
              </span>
              <span>
                C:{' '}
                <strong
                  className={
                    displayOhlc.close >= displayOhlc.open ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {displayOhlc.close.toFixed(decimals)}
                </strong>
              </span>
              <span className="text-slate-500">Vol: {displayOhlc.volume.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Right: Technical Indicators & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Indicators Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsDropdown(!showIndicatorsDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Indicators</span>
            </button>

            {showIndicatorsDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Trend & Moving Averages
                </div>

                <button
                  onClick={() => onToggleIndicator('ema9')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>EMA 9</span>
                  </span>
                  {indicators.ema9 ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('ema20')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>EMA 20</span>
                  </span>
                  {indicators.ema20 ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('ema50')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>EMA 50</span>
                  </span>
                  {indicators.ema50 ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('ema200')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    <span>EMA 200</span>
                  </span>
                  {indicators.ema200 ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('bollinger')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>Bollinger Bands (20,2)</span>
                  </span>
                  {indicators.bollinger ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800">
                  Oscillators & Volume
                </div>

                <button
                  onClick={() => onToggleIndicator('rsi')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>RSI (14)</span>
                  </span>
                  {indicators.rsi ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('macd')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>MACD (12, 26, 9)</span>
                  </span>
                  {indicators.macd ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>

                <button
                  onClick={() => onToggleIndicator('volume')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Volume Sub-pane</span>
                  </span>
                  {indicators.volume ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      <div className="flex-1 w-full relative min-h-[360px]" ref={chartContainerRef} />

      {/* Secondary Bottom Oscillator Strips (RSI / MACD) */}
      {(indicators.rsi || indicators.macd) && (
        <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-2 flex flex-wrap items-center gap-6 text-[11px] font-mono">
          {indicators.rsi && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">RSI(14):</span>
              <span
                className={`font-black ${
                  latestRsi >= 70
                    ? 'text-rose-400'
                    : latestRsi <= 30
                    ? 'text-emerald-400'
                    : 'text-indigo-400'
                }`}
              >
                {latestRsi.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500">
                {latestRsi >= 70 ? '(Overbought)' : latestRsi <= 30 ? '(Oversold)' : '(Neutral)'}
              </span>
            </div>
          )}

          {indicators.macd && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">MACD:</span>
                <span className={latestMacd >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {latestMacd.toFixed(decimals)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">Signal:</span>
                <span className="text-amber-400">{latestSignal.toFixed(decimals)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">Hist:</span>
                <span className={latestHist >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {latestHist.toFixed(decimals)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
