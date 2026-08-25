import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  MoveRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Unlock,
  Settings,
  Plus,
  Compass,
  Zap,
} from 'lucide-react';
import {
  ReplayCandle,
  ReplayPosition,
  ReplayTrade,
  PendingOrder,
  ChartType,
  ChartDrawing,
  DrawingToolType,
  DrawingPoint,
  IndicatorConfig,
  ChartAlert,
  ChartSettingsConfig,
} from '../types';
import {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateVWAP,
  calculateSupertrend,
  calculateParabolicSAR,
  calculateIchimoku,
  calculateBollingerBands,
  calculateKeltnerChannels,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateCCI,
  calculateMomentum,
  calculateATR,
  calculateVolumeMA,
  calculateOBV,
  calculateVolumeProfile,
} from '../indicatorCalculations';

interface ProfessionalChartCanvasProps {
  candles: ReplayCandle[];
  symbol: string;
  timeframe: string;
  decimals: number;
  pipSize: number;
  chartType: ChartType;
  positions: ReplayPosition[];
  pendingOrders?: PendingOrder[];
  trades?: ReplayTrade[];
  drawings: ChartDrawing[];
  onUpdateDrawings: (drawings: ChartDrawing[]) => void;
  activeDrawingTool: DrawingToolType;
  onSelectDrawingTool: (tool: DrawingToolType) => void;
  indicators: IndicatorConfig[];
  alerts?: ChartAlert[];
  theme: 'dark' | 'light' | 'liquid';
  chartSettings: ChartSettingsConfig;
  onUpdatePositionSlTp?: (positionId: string, stopLoss?: number, takeProfit?: number) => void;
  onStartReplayFromCandle?: (candleIndex: number) => void;
  onExecuteQuickOrder?: (dir: 'BUY' | 'SELL', price: number) => void;
  onOpenAlertModalAtPrice?: (price: number) => void;
  onOpenSettingsModal?: () => void;
  formatCurrency: (val: number) => string;
  isReplayModeActive?: boolean;
}

export const ProfessionalChartCanvas: React.FC<ProfessionalChartCanvasProps> = ({
  candles,
  symbol,
  timeframe,
  decimals,
  pipSize,
  chartType,
  positions,
  pendingOrders = [],
  trades = [],
  drawings,
  onUpdateDrawings,
  activeDrawingTool,
  onSelectDrawingTool,
  indicators,
  alerts = [],
  theme,
  chartSettings,
  onUpdatePositionSlTp,
  onStartReplayFromCandle,
  onExecuteQuickOrder,
  onOpenAlertModalAtPrice,
  onOpenSettingsModal,
  formatCurrency,
  isReplayModeActive,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport / Camera State (Candle indices & Price bounds)
  const [viewState, setViewState] = useState({
    candleWidth: 8, // pixels per candle
    rightOffset: 15, // blank candles on right edge
    scrollOffset: 0, // negative moves right, positive moves left
    isAutoScaled: true,
    manualMinPrice: 0,
    manualMaxPrice: 0,
  });

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; scrollOffset: number } | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number; candleIndex: number; price: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<ReplayCandle | null>(null);

  // Active Drawing In Progress
  const [activeDrawingPoints, setActiveDrawingPoints] = useState<DrawingPoint[]>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [draggedHandle, setDraggedHandle] = useState<{ drawingId: string; pointIndex: number } | null>(null);
  const [draggedOrderHandle, setDraggedOrderHandle] = useState<{ posId: string; type: 'SL' | 'TP' } | null>(null);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    price: number;
    candleIndex: number;
  } | null>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layout measurements
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });
  const rightScaleWidth = 72;
  const bottomScaleHeight = 26;

  // Active lower indicator panes
  const lowerPanes = useMemo(() => {
    const list: { id: string; name: string; type: string; config: IndicatorConfig }[] = [];
    indicators.forEach(ind => {
      if (ind.visible && (ind.pane === 'LOWER_1' || ind.pane === 'LOWER_2' || ind.pane === 'LOWER_3')) {
        list.push({ id: ind.id, name: ind.name, type: ind.type, config: ind });
      }
    });
    return list;
  }, [indicators]);

  const hasLowerPanes = lowerPanes.length > 0;
  const mainChartHeightRatio = hasLowerPanes ? (lowerPanes.length === 1 ? 0.72 : 0.60) : 1.0;

  // Update canvas size on container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasDimensions({
          width: Math.max(300, Math.floor(rect.width)),
          height: Math.max(260, Math.floor(rect.height)),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute visible candle range
  const { visibleStartIdx, visibleEndIdx, candleWidth } = useMemo(() => {
    const totalCandles = candles.length;
    const width = canvasDimensions.width - rightScaleWidth;
    const cWidth = viewState.candleWidth;
    const visibleCount = Math.ceil(width / cWidth);

    const rightMostIdx = totalCandles - 1 + viewState.rightOffset - viewState.scrollOffset;
    const endIdx = Math.min(totalCandles - 1, Math.max(0, Math.floor(rightMostIdx)));
    const startIdx = Math.max(0, Math.floor(endIdx - visibleCount));

    return {
      visibleStartIdx: startIdx,
      visibleEndIdx: endIdx,
      candleWidth: cWidth,
    };
  }, [candles.length, canvasDimensions.width, viewState.candleWidth, viewState.rightOffset, viewState.scrollOffset]);

  const visibleCandles = useMemo(() => {
    return candles.slice(visibleStartIdx, visibleEndIdx + 1);
  }, [candles, visibleStartIdx, visibleEndIdx]);

  // Compute price bounds for main chart
  const { minPrice, maxPrice } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 1, maxPrice: 2 };

    let min = Infinity;
    let max = -Infinity;

    visibleCandles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    // Also include active position SL/TP if in view
    positions.forEach(pos => {
      if (pos.stopLoss) {
        if (pos.stopLoss < min) min = pos.stopLoss;
        if (pos.stopLoss > max) max = pos.stopLoss;
      }
      if (pos.takeProfit) {
        if (pos.takeProfit < min) min = pos.takeProfit;
        if (pos.takeProfit > max) max = pos.takeProfit;
      }
      if (pos.entryPrice < min) min = pos.entryPrice;
      if (pos.entryPrice > max) max = pos.entryPrice;
    });

    if (min === max || !isFinite(min) || !isFinite(max)) {
      min = (candles[candles.length - 1]?.close || 100) * 0.98;
      max = (candles[candles.length - 1]?.close || 100) * 1.02;
    }

    const padding = (max - min) * 0.08; // 8% vertical padding
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
    };
  }, [visibleCandles, positions, candles]);

  // Coordinate Conversion Helpers
  const mainPlotHeight = (canvasDimensions.height - bottomScaleHeight) * mainChartHeightRatio;
  const mainPlotWidth = canvasDimensions.width - rightScaleWidth;

  const priceToY = useCallback(
    (price: number) => {
      const range = maxPrice - minPrice;
      if (range <= 0) return mainPlotHeight / 2;
      return mainPlotHeight - ((price - minPrice) / range) * mainPlotHeight;
    },
    [maxPrice, minPrice, mainPlotHeight]
  );

  const yToPrice = useCallback(
    (y: number) => {
      const range = maxPrice - minPrice;
      if (mainPlotHeight <= 0) return minPrice;
      const normalized = (mainPlotHeight - y) / mainPlotHeight;
      return minPrice + normalized * range;
    },
    [maxPrice, minPrice, mainPlotHeight]
  );

  const candleIndexToX = useCallback(
    (index: number) => {
      const totalCandles = candles.length;
      const rightMostIdx = totalCandles - 1 + viewState.rightOffset - viewState.scrollOffset;
      const offsetFromRight = rightMostIdx - index;
      return mainPlotWidth - offsetFromRight * candleWidth;
    },
    [candles.length, viewState.rightOffset, viewState.scrollOffset, candleWidth, mainPlotWidth]
  );

  const xToCandleIndex = useCallback(
    (x: number) => {
      const totalCandles = candles.length;
      const rightMostIdx = totalCandles - 1 + viewState.rightOffset - viewState.scrollOffset;
      const offsetFromRight = (mainPlotWidth - x) / candleWidth;
      return Math.round(rightMostIdx - offsetFromRight);
    },
    [candles.length, viewState.rightOffset, viewState.scrollOffset, candleWidth, mainPlotWidth]
  );

  // ----------------------------------------------------
  // MASTER RENDER LOOP
  // ----------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasDimensions.width * dpr;
    canvas.height = canvasDimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = canvasDimensions.width;
    const height = canvasDimensions.height;

    // Theme Colors
    const isDark = theme === 'dark' || theme === 'liquid';
    const bgColor = isDark ? '#0b0f19' : '#f8fafc';
    const gridColor = isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(226, 232, 240, 0.7)';
    const textMuted = isDark ? '#64748b' : '#94a3b8';
    const textBright = isDark ? '#f8fafc' : '#0f172a';
    const borderCol = isDark ? '#1e293b' : '#e2e8f0';

    const bullColor = chartSettings.bullishColor || '#10b981';
    const bearColor = chartSettings.bearishColor || '#f43f5e';
    const wickColor = chartSettings.wickColor || (isDark ? '#94a3b8' : '#64748b');

    // 1. Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Gridlines & Scales
    if (chartSettings.showGridLines) {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);

      // Horizontal price grid lines (5-8 lines)
      const priceSteps = 6;
      for (let i = 0; i <= priceSteps; i++) {
        const p = minPrice + (i / priceSteps) * (maxPrice - minPrice);
        const y = priceToY(p);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(mainPlotWidth, y);
        ctx.stroke();
      }

      // Vertical time grid lines
      const visibleCount = visibleEndIdx - visibleStartIdx;
      const step = Math.max(1, Math.floor(visibleCount / 7));
      for (let idx = visibleStartIdx; idx <= visibleEndIdx; idx += step) {
        const x = candleIndexToX(idx);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, mainPlotHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 3. Watermark
    if (chartSettings.showWatermark) {
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)';
      ctx.font = '900 64px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, mainPlotWidth / 2, mainPlotHeight / 2 - 20);
      ctx.font = '700 24px Inter, system-ui, sans-serif';
      ctx.fillText(timeframe.toUpperCase() + ' • DUSKFLOW PRO REPLAY', mainPlotWidth / 2, mainPlotHeight / 2 + 35);
      ctx.restore();
    }

    // 4. Draw Main Chart Data (Candles, Bars, Line, Area, etc.)
    if (chartType === 'LINE' || chartType === 'AREA') {
      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const idx = visibleStartIdx + i;
        const x = candleIndexToX(idx);
        const y = priceToY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (chartType === 'AREA') {
        const lastX = candleIndexToX(visibleEndIdx);
        const firstX = candleIndexToX(visibleStartIdx);
        ctx.lineTo(lastX, mainPlotHeight);
        ctx.lineTo(firstX, mainPlotHeight);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, mainPlotHeight);
        grad.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Candlesticks / OHLC Bars / Heikin Ashi / Renko
      visibleCandles.forEach((c, i) => {
        const idx = visibleStartIdx + i;
        const x = candleIndexToX(idx);
        const isBull = c.close >= c.open;
        const cColor = isBull ? bullColor : bearColor;

        const openY = priceToY(c.open);
        const closeY = priceToY(c.close);
        const highY = priceToY(c.high);
        const lowY = priceToY(c.low);

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));
        const bodyWidth = Math.max(2, candleWidth - 2);

        if (chartType === 'BAR') {
          // OHLC Tick Bar
          ctx.strokeStyle = cColor;
          ctx.lineWidth = Math.max(1, candleWidth > 6 ? 1.5 : 1);
          // Vertical spine
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();
          // Open tick (left)
          ctx.beginPath();
          ctx.moveTo(x - bodyWidth / 2, openY);
          ctx.lineTo(x, openY);
          ctx.stroke();
          // Close tick (right)
          ctx.beginPath();
          ctx.moveTo(x, closeY);
          ctx.lineTo(x + bodyWidth / 2, closeY);
          ctx.stroke();
        } else {
          // Standard Candlestick & Heikin Ashi
          // Wick
          ctx.strokeStyle = wickColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, highY);
          ctx.lineTo(x, lowY);
          ctx.stroke();

          // Body
          ctx.fillStyle = cColor;
          ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);

          // Subtle border for crisp contrast
          ctx.strokeStyle = cColor;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
        }
      });
    }

    // 5. Render Main Pane Indicators (SMA, EMA, VWAP, Bollinger, etc.)
    indicators.forEach(ind => {
      if (!ind.visible || ind.pane !== 'MAIN') return;

      if (ind.type === 'SMA' || ind.type === 'EMA' || ind.type === 'WMA') {
        const period = Number(ind.params.period) || 20;
        const pts =
          ind.type === 'SMA'
            ? calculateSMA(candles, period)
            : ind.type === 'EMA'
            ? calculateEMA(candles, period)
            : calculateWMA(candles, period);

        ctx.strokeStyle = ind.styles.color;
        ctx.lineWidth = ind.styles.lineWidth || 1.5;
        ctx.beginPath();
        let started = false;

        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.value);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        ctx.stroke();
      }

      if (ind.type === 'VWAP') {
        const pts = calculateVWAP(candles);
        ctx.strokeStyle = ind.styles.color || '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.value);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        });
        ctx.stroke();
      }

      if (ind.type === 'BOLLINGER') {
        const period = Number(ind.params.period) || 20;
        const std = Number(ind.params.stdDev) || 2;
        const pts = calculateBollingerBands(candles, period, std);

        // Upper & Lower bands + Middle
        ctx.strokeStyle = ind.styles.color || '#38bdf8';
        ctx.lineWidth = 1;

        // Middle
        ctx.beginPath();
        let started = false;
        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.middle);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Upper
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        started = false;
        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.upper);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        // Lower
        ctx.beginPath();
        started = false;
        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.lower);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (ind.type === 'SUPERTREND') {
        const pts = calculateSupertrend(candles);
        pts.forEach((p, idx) => {
          if (idx === 0) return;
          const prevP = pts[idx - 1];
          const candleIdx = candles.findIndex(c => c.time === p.time);
          const prevCandleIdx = candles.findIndex(c => c.time === prevP.time);

          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            ctx.strokeStyle = p.direction === 1 ? '#10b981' : '#f43f5e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(candleIndexToX(prevCandleIdx), priceToY(prevP.value));
            ctx.lineTo(candleIndexToX(candleIdx), priceToY(p.value));
            ctx.stroke();
          }
        });
      }

      if (ind.type === 'PARABOLIC_SAR') {
        const pts = calculateParabolicSAR(candles);
        pts.forEach(p => {
          const candleIdx = candles.findIndex(c => c.time === p.time);
          if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
            const x = candleIndexToX(candleIdx);
            const y = priceToY(p.sar);
            ctx.fillStyle = p.isBull ? '#10b981' : '#f43f5e';
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      if (ind.type === 'VOLUME_PROFILE') {
        const vp = calculateVolumeProfile(visibleCandles, 24);
        let maxV = 0;
        vp.forEach(b => {
          if (b.volume > maxV) maxV = b.volume;
        });

        const maxBarWidth = 120;
        vp.forEach(b => {
          const yTop = priceToY(b.priceHigh);
          const yBottom = priceToY(b.priceLow);
          const barH = Math.max(2, Math.abs(yBottom - yTop) - 1);
          const totalW = (b.volume / (maxV || 1)) * maxBarWidth;
          const buyW = (b.buyVolume / (b.volume || 1)) * totalW;
          const sellW = totalW - buyW;

          // Buy vol (green)
          ctx.fillStyle = b.isPoc ? 'rgba(234, 179, 8, 0.4)' : 'rgba(16, 185, 129, 0.25)';
          ctx.fillRect(0, yTop, buyW, barH);

          // Sell vol (red)
          ctx.fillStyle = b.isPoc ? 'rgba(234, 179, 8, 0.55)' : 'rgba(244, 63, 94, 0.25)';
          ctx.fillRect(buyW, yTop, sellW, barH);

          if (b.isPoc) {
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.moveTo(0, yTop + barH / 2);
            ctx.lineTo(mainPlotWidth, yTop + barH / 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }
    });

    // 6. Draw User Chart Drawings
    drawings.forEach(d => {
      if (d.visible === false) return;
      ctx.save();
      ctx.strokeStyle = d.color || '#3b82f6';
      ctx.fillStyle = d.fillColor || 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = d.lineWidth || 2;
      ctx.globalAlpha = d.opacity || 1.0;

      if (d.lineStyle === 'dashed') ctx.setLineDash([6, 4]);
      else if (d.lineStyle === 'dotted') ctx.setLineDash([2, 3]);

      if (d.type === 'TREND_LINE' || d.type === 'ARROW' || d.type === 'EXTENDED_LINE') {
        if (d.points.length >= 2) {
          const idx0 = candles.findIndex(c => c.time === d.points[0].time);
          const idx1 = candles.findIndex(c => c.time === d.points[1].time);
          const x0 = candleIndexToX(idx0 >= 0 ? idx0 : 0);
          const y0 = priceToY(d.points[0].price);
          const x1 = candleIndexToX(idx1 >= 0 ? idx1 : candles.length - 1);
          const y1 = priceToY(d.points[1].price);

          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          if (d.type === 'ARROW') {
            const angle = Math.atan2(y1 - y0, x1 - x0);
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - 12 * Math.cos(angle - Math.PI / 6), y1 - 12 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x1 - 12 * Math.cos(angle + Math.PI / 6), y1 - 12 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      if (d.type === 'HORIZONTAL_LINE' || d.type === 'HORIZONTAL_RAY') {
        if (d.points.length >= 1) {
          const y = priceToY(d.points[0].price);
          const startX = d.type === 'HORIZONTAL_RAY'
            ? candleIndexToX(candles.findIndex(c => c.time === d.points[0].time))
            : 0;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(mainPlotWidth, y);
          ctx.stroke();
        }
      }

      if (d.type === 'VERTICAL_LINE') {
        if (d.points.length >= 1) {
          const idx = candles.findIndex(c => c.time === d.points[0].time);
          const x = candleIndexToX(idx >= 0 ? idx : 0);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, mainPlotHeight);
          ctx.stroke();
        }
      }

      if (d.type === 'RECTANGLE' && d.points.length >= 2) {
        const idx0 = candles.findIndex(c => c.time === d.points[0].time);
        const idx1 = candles.findIndex(c => c.time === d.points[1].time);
        const x0 = candleIndexToX(idx0 >= 0 ? idx0 : 0);
        const y0 = priceToY(d.points[0].price);
        const x1 = candleIndexToX(idx1 >= 0 ? idx1 : candles.length - 1);
        const y1 = priceToY(d.points[1].price);

        const rx = Math.min(x0, x1);
        const ry = Math.min(y0, y1);
        const rw = Math.abs(x1 - x0);
        const rh = Math.abs(y1 - y0);

        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }

      if (d.type === 'FIB_RETRACEMENT' && d.points.length >= 2) {
        const idx0 = candles.findIndex(c => c.time === d.points[0].time);
        const idx1 = candles.findIndex(c => c.time === d.points[1].time);
        const x0 = candleIndexToX(idx0 >= 0 ? idx0 : 0);
        const y0 = priceToY(d.points[0].price);
        const x1 = candleIndexToX(idx1 >= 0 ? idx1 : candles.length - 1);
        const y1 = priceToY(d.points[1].price);

        const p0 = d.points[0].price;
        const p1 = d.points[1].price;
        const diff = p1 - p0;

        const levels = [
          { r: 0, col: '#94a3b8' },
          { r: 0.236, col: '#f43f5e' },
          { r: 0.382, col: '#f97316' },
          { r: 0.5, col: '#eab308' },
          { r: 0.618, col: '#10b981' },
          { r: 0.786, col: '#06b6d4' },
          { r: 1.0, col: '#94a3b8' },
        ];

        levels.forEach(lvl => {
          const priceLevel = p0 + diff * lvl.r;
          const y = priceToY(priceLevel);
          ctx.strokeStyle = lvl.col;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(Math.min(x0, x1), y);
          ctx.lineTo(Math.max(x0, x1) + 40, y);
          ctx.stroke();

          ctx.fillStyle = lvl.col;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`${lvl.r} (${priceLevel.toFixed(decimals)})`, Math.max(x0, x1) + 5, y - 3);
        });
      }

      if ((d.type === 'LONG_POSITION' || d.type === 'SHORT_POSITION') && d.points.length >= 1) {
        const isLong = d.type === 'LONG_POSITION';
        const entryP = d.entryPrice || d.points[0].price;
        const slP = d.stopPrice || (isLong ? entryP * 0.99 : entryP * 1.01);
        const tpP = d.targetPrice || (isLong ? entryP * 1.02 : entryP * 0.98);

        const idx = candles.findIndex(c => c.time === d.points[0].time);
        const startX = candleIndexToX(idx >= 0 ? idx : visibleStartIdx);
        const boxWidth = 140;

        const entryY = priceToY(entryP);
        const slY = priceToY(slP);
        const tpY = priceToY(tpP);

        // Profit Zone (Green)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        const profitTop = Math.min(entryY, tpY);
        const profitH = Math.abs(tpY - entryY);
        ctx.fillRect(startX, profitTop, boxWidth, profitH);
        ctx.strokeRect(startX, profitTop, boxWidth, profitH);

        // Loss Zone (Red)
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.strokeStyle = '#f43f5e';
        const lossTop = Math.min(entryY, slY);
        const lossH = Math.abs(slY - entryY);
        ctx.fillRect(startX, lossTop, boxWidth, lossH);
        ctx.strokeRect(startX, lossTop, boxWidth, lossH);

        // Entry Line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startX, entryY);
        ctx.lineTo(startX + boxWidth, entryY);
        ctx.stroke();

        // R:R Badge
        const riskDist = Math.abs(entryP - slP);
        const rewardDist = Math.abs(tpP - entryP);
        const rr = riskDist > 0 ? (rewardDist / riskDist).toFixed(2) : '0.00';

        ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
        ctx.fillRect(startX + 10, entryY - 10, 80, 20);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(startX + 10, entryY - 10, 80, 20);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillText(`R:R 1:${rr}`, startX + 16, entryY + 4);
      }

      // Draw Selected Handles for Dragging
      if (selectedDrawingId === d.id) {
        d.points.forEach((pt, pIdx) => {
          const cIdx = candles.findIndex(c => c.time === pt.time);
          const hx = candleIndexToX(cIdx >= 0 ? cIdx : 0);
          const hy = priceToY(pt.price);

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hx, hy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      ctx.restore();
    });

    // 7. Render Active Positions & Drag Lines
    positions.forEach(pos => {
      const entryY = priceToY(pos.entryPrice);
      const isBuy = pos.direction === 'BUY';

      // Entry line
      ctx.strokeStyle = isBuy ? '#3b82f6' : '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(mainPlotWidth, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Entry Tag
      ctx.fillStyle = isBuy ? '#2563eb' : '#db2777';
      ctx.fillRect(mainPlotWidth - 160, entryY - 10, 150, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(
        `${pos.direction} ${pos.lotSize}L @ ${pos.entryPrice.toFixed(decimals)}`,
        mainPlotWidth - 152,
        entryY + 4
      );

      // Stop Loss Line (Draggable)
      if (pos.stopLoss) {
        const slY = priceToY(pos.stopLoss);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(mainPlotWidth, slY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draggable SL Handle Pill
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(mainPlotWidth - 140, slY - 10, 130, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        const slPips = Math.abs(pos.entryPrice - pos.stopLoss) / pipSize;
        ctx.fillText(`🛑 SL: ${pos.stopLoss.toFixed(decimals)} (-${slPips.toFixed(0)}p)`, mainPlotWidth - 134, slY + 4);
      }

      // Take Profit Line (Draggable)
      if (pos.takeProfit) {
        const tpY = priceToY(pos.takeProfit);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, tpY);
        ctx.lineTo(mainPlotWidth, tpY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draggable TP Handle Pill
        ctx.fillStyle = '#059669';
        ctx.fillRect(mainPlotWidth - 140, tpY - 10, 130, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        const tpPips = Math.abs(pos.takeProfit - pos.entryPrice) / pipSize;
        ctx.fillText(`🎯 TP: ${pos.takeProfit.toFixed(decimals)} (+${tpPips.toFixed(0)}p)`, mainPlotWidth - 134, tpY + 4);
      }
    });

    // 8. Render Pending Orders
    pendingOrders.forEach(po => {
      if (po.status !== 'PENDING') return;
      const orderY = priceToY(po.targetPrice);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, orderY);
      ctx.lineTo(mainPlotWidth, orderY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#d97706';
      ctx.fillRect(mainPlotWidth - 160, orderY - 10, 150, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(
        `⏳ ${po.orderType} ${po.direction} ${po.lotSize}L @ ${po.targetPrice.toFixed(decimals)}`,
        mainPlotWidth - 152,
        orderY + 4
      );
    });

    // 9. Render Lower Indicator Sub-Panes (RSI, MACD, Stochastic, etc.)
    if (hasLowerPanes) {
      const lowerHeight = height - bottomScaleHeight - mainPlotHeight;
      const paneHeight = lowerHeight / lowerPanes.length;

      lowerPanes.forEach((lp, pIdx) => {
        const paneTop = mainPlotHeight + pIdx * paneHeight;
        const paneBottom = paneTop + paneHeight;

        // Pane separator line & background
        ctx.fillStyle = isDark ? '#090d16' : '#f1f5f9';
        ctx.fillRect(0, paneTop, mainPlotWidth, paneHeight);

        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, paneTop);
        ctx.lineTo(width, paneTop);
        ctx.stroke();

        // Pane label
        ctx.fillStyle = textBright;
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.fillText(lp.name, 10, paneTop + 16);

        if (lp.type === 'RSI') {
          const rsiPts = calculateRSI(candles, Number(lp.config.params.period) || 14);

          // Overbought 70 & Oversold 30 lines
          const rsiToY = (val: number) => paneBottom - (val / 100) * paneHeight;
          const y70 = rsiToY(70);
          const y30 = rsiToY(30);

          ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.08)';
          ctx.fillRect(0, y70, mainPlotWidth, y30 - y70);

          ctx.strokeStyle = textMuted;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, y70);
          ctx.lineTo(mainPlotWidth, y70);
          ctx.moveTo(0, y30);
          ctx.lineTo(mainPlotWidth, y30);
          ctx.stroke();
          ctx.setLineDash([]);

          // RSI Line
          ctx.strokeStyle = lp.config.styles.color || '#a855f7';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          let started = false;
          rsiPts.forEach(p => {
            const candleIdx = candles.findIndex(c => c.time === p.time);
            if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
              const x = candleIndexToX(candleIdx);
              const y = rsiToY(p.value);
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else ctx.lineTo(x, y);
            }
          });
          ctx.stroke();

          // Value badge on right
          const latestVal = rsiPts.length > 0 ? rsiPts[rsiPts.length - 1].value : 50;
          ctx.fillStyle = lp.config.styles.color || '#a855f7';
          ctx.fillText(`RSI: ${latestVal.toFixed(1)}`, 85, paneTop + 16);
        }

        if (lp.type === 'MACD') {
          const macdPts = calculateMACD(candles);
          let maxVal = 0.0001;
          macdPts.forEach(p => {
            if (Math.abs(p.macd) > maxVal) maxVal = Math.abs(p.macd);
            if (Math.abs(p.signal) > maxVal) maxVal = Math.abs(p.signal);
            if (Math.abs(p.histogram) > maxVal) maxVal = Math.abs(p.histogram);
          });

          const macdToY = (val: number) => paneTop + paneHeight / 2 - (val / maxVal) * (paneHeight / 2.2);

          // Zero line
          const zeroY = macdToY(0);
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(0, zeroY);
          ctx.lineTo(mainPlotWidth, zeroY);
          ctx.stroke();

          // Histogram bars
          macdPts.forEach(p => {
            const candleIdx = candles.findIndex(c => c.time === p.time);
            if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
              const x = candleIndexToX(candleIdx);
              const y = macdToY(p.histogram);
              const isGreen = p.histogram >= 0;
              ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.7)' : 'rgba(244, 63, 94, 0.7)';
              const barH = Math.abs(zeroY - y);
              const barTop = Math.min(zeroY, y);
              ctx.fillRect(x - candleWidth / 3, barTop, Math.max(1, candleWidth * 0.6), barH);
            }
          });

          // MACD line
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let started = false;
          macdPts.forEach(p => {
            const candleIdx = candles.findIndex(c => c.time === p.time);
            if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
              const x = candleIndexToX(candleIdx);
              const y = macdToY(p.macd);
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else ctx.lineTo(x, y);
            }
          });
          ctx.stroke();

          // Signal line
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          started = false;
          macdPts.forEach(p => {
            const candleIdx = candles.findIndex(c => c.time === p.time);
            if (candleIdx >= visibleStartIdx && candleIdx <= visibleEndIdx) {
              const x = candleIndexToX(candleIdx);
              const y = macdToY(p.signal);
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
      });
    }

    // 10. Draw Right Price Scale
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(mainPlotWidth, 0, rightScaleWidth, height);
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mainPlotWidth, 0);
    ctx.lineTo(mainPlotWidth, height);
    ctx.stroke();

    // Price Scale Labels
    ctx.fillStyle = textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (i / priceSteps) * (maxPrice - minPrice);
      const y = priceToY(p);
      ctx.fillText(p.toFixed(decimals), mainPlotWidth + 6, y + 3);
    }

    // Current Price Badge on Right Scale
    if (candles.length > 0) {
      const currentCandle = candles[candles.length - 1];
      const curPrice = currentCandle.close;
      const curY = priceToY(curPrice);
      const isUp = currentCandle.close >= currentCandle.open;

      ctx.fillStyle = isUp ? bullColor : bearColor;
      ctx.fillRect(mainPlotWidth, curY - 10, rightScaleWidth, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(curPrice.toFixed(decimals), mainPlotWidth + 6, curY + 4);
    }

    // 11. Draw Bottom Time Scale
    ctx.fillStyle = isDark ? '#0b0f19' : '#f1f5f9';
    ctx.fillRect(0, height - bottomScaleHeight, width, bottomScaleHeight);
    ctx.strokeStyle = borderCol;
    ctx.beginPath();
    ctx.moveTo(0, height - bottomScaleHeight);
    ctx.lineTo(width, height - bottomScaleHeight);
    ctx.stroke();

    // Time Scale Labels
    ctx.fillStyle = textMuted;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const visibleCount = visibleEndIdx - visibleStartIdx;
    const timeStep = Math.max(1, Math.floor(visibleCount / 6));
    for (let idx = visibleStartIdx; idx <= visibleEndIdx; idx += timeStep) {
      const c = candles[idx];
      if (c) {
        const x = candleIndexToX(idx);
        const dateStr = c.timeString ? c.timeString.substring(5) : '';
        ctx.fillText(dateStr, x, height - 8);
      }
    }

    // 12. Crosshair & Coordinate Tooltip Hover
    if (crosshairPos && crosshairPos.x < mainPlotWidth && crosshairPos.y < mainPlotHeight) {
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshairPos.x, 0);
      ctx.lineTo(crosshairPos.x, height - bottomScaleHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshairPos.y);
      ctx.lineTo(mainPlotWidth, crosshairPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Tag on Right Scale
      ctx.fillStyle = isDark ? '#334155' : '#475569';
      ctx.fillRect(mainPlotWidth, crosshairPos.y - 9, rightScaleWidth, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(crosshairPos.price.toFixed(decimals), mainPlotWidth + 6, crosshairPos.y + 4);

      // Date Tag on Bottom Scale
      if (hoveredCandle) {
        ctx.fillStyle = isDark ? '#334155' : '#475569';
        ctx.fillRect(crosshairPos.x - 50, height - bottomScaleHeight, 100, 20);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(hoveredCandle.timeString || '', crosshairPos.x, height - 6);
      }
    }
  }, [
    candles,
    visibleCandles,
    visibleStartIdx,
    visibleEndIdx,
    minPrice,
    maxPrice,
    canvasDimensions,
    chartType,
    theme,
    chartSettings,
    symbol,
    timeframe,
    decimals,
    pipSize,
    positions,
    pendingOrders,
    drawings,
    selectedDrawingId,
    indicators,
    lowerPanes,
    hasLowerPanes,
    mainChartHeightRatio,
    crosshairPos,
    hoveredCandle,
    candleIndexToX,
    priceToY,
    candleWidth,
    mainPlotWidth,
    mainPlotHeight,
  ]);

  // ----------------------------------------------------
  // INTERACTIVE MOUSE & TOUCH EVENT HANDLERS
  // ----------------------------------------------------

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // ignore right click
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedPrice = yToPrice(y);
    const clickedIndex = xToCandleIndex(x);
    const clickedCandle = candles[clickedIndex];

    // 1. Check if clicking on SL/TP drag handle pill
    positions.forEach(pos => {
      if (pos.stopLoss) {
        const slY = priceToY(pos.stopLoss);
        if (Math.abs(y - slY) < 12 && x > mainPlotWidth - 150) {
          setDraggedOrderHandle({ posId: pos.id, type: 'SL' });
          return;
        }
      }
      if (pos.takeProfit) {
        const tpY = priceToY(pos.takeProfit);
        if (Math.abs(y - tpY) < 12 && x > mainPlotWidth - 150) {
          setDraggedOrderHandle({ posId: pos.id, type: 'TP' });
          return;
        }
      }
    });

    // 2. If drawing tool is active (e.g. Trendline, Horizontal Line, Rectangle, etc.)
    if (activeDrawingTool !== 'CURSOR' && activeDrawingTool !== 'CROSSHAIR' && activeDrawingTool !== 'PAN') {
      const newPoint: DrawingPoint = {
        time: clickedCandle ? clickedCandle.time : candles[candles.length - 1]?.time || Date.now() / 1000,
        price: clickedPrice,
      };

      if (activeDrawingTool === 'HORIZONTAL_LINE' || activeDrawingTool === 'HORIZONTAL_RAY' || activeDrawingTool === 'PRICE_LABEL') {
        const newDrawing: ChartDrawing = {
          id: 'draw-' + Date.now(),
          type: activeDrawingTool,
          points: [newPoint],
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: 'solid',
          opacity: 1,
        };
        onUpdateDrawings([...drawings, newDrawing]);
        onSelectDrawingTool('CURSOR');
      } else {
        if (activeDrawingPoints.length === 0) {
          setActiveDrawingPoints([newPoint]);
        } else {
          // Completed second point
          const completePoints = [...activeDrawingPoints, newPoint];
          const newDrawing: ChartDrawing = {
            id: 'draw-' + Date.now(),
            type: activeDrawingTool,
            points: completePoints,
            color: activeDrawingTool.includes('LONG') ? '#10b981' : activeDrawingTool.includes('SHORT') ? '#f43f5e' : '#38bdf8',
            fillColor: activeDrawingTool === 'RECTANGLE' ? 'rgba(56, 189, 248, 0.15)' : undefined,
            lineWidth: 2,
            lineStyle: 'solid',
            opacity: 1,
            entryPrice: activeDrawingTool === 'LONG_POSITION' || activeDrawingTool === 'SHORT_POSITION' ? completePoints[0].price : undefined,
            stopPrice: activeDrawingTool === 'LONG_POSITION' ? completePoints[0].price * 0.99 : completePoints[0].price * 1.01,
            targetPrice: activeDrawingTool === 'LONG_POSITION' ? completePoints[0].price * 1.02 : completePoints[0].price * 0.98,
          };
          onUpdateDrawings([...drawings, newDrawing]);
          setActiveDrawingPoints([]);
          onSelectDrawingTool('CURSOR');
        }
      }
      return;
    }

    // 3. Otherwise, initiate Pan / Drag
    setIsDragging(true);
    setDragStart({ x, y, scrollOffset: viewState.scrollOffset });
    setContextMenu(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const price = yToPrice(y);
    const candleIndex = Math.min(candles.length - 1, Math.max(0, xToCandleIndex(x)));
    const candle = candles[candleIndex] || null;

    setCrosshairPos({ x, y, candleIndex, price });
    setHoveredCandle(candle);

    // 1. Dragging active order SL/TP handle
    if (draggedOrderHandle && onUpdatePositionSlTp) {
      const pos = positions.find(p => p.id === draggedOrderHandle.posId);
      if (pos) {
        if (draggedOrderHandle.type === 'SL') {
          onUpdatePositionSlTp(pos.id, price, pos.takeProfit);
        } else {
          onUpdatePositionSlTp(pos.id, pos.stopLoss, price);
        }
      }
      return;
    }

    // 2. Dragging chart canvas viewport
    if (isDragging && dragStart) {
      const deltaX = x - dragStart.x;
      const candleDelta = Math.round(deltaX / viewState.candleWidth);
      setViewState(prev => ({
        ...prev,
        scrollOffset: dragStart.scrollOffset + candleDelta,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDraggedOrderHandle(null);
  };

  // Zoom with mouse wheel (at mouse pointer position)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setViewState(prev => ({
      ...prev,
      candleWidth: Math.min(40, Math.max(2, prev.candleWidth * zoomFactor)),
    }));
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const price = yToPrice(y);
    const candleIndex = Math.min(candles.length - 1, Math.max(0, xToCandleIndex(x)));

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      price,
      candleIndex,
    });
  };

  // Reset View
  const handleResetView = () => {
    setViewState(prev => ({
      ...prev,
      candleWidth: 8,
      rightOffset: 15,
      scrollOffset: 0,
    }));
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const lastCandle = candles[candles.length - 1];
  const activeCandle = hoveredCandle || lastCandle;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col rounded-2xl overflow-hidden select-none border transition-all ${
        theme === 'liquid'
          ? 'bg-slate-950/80 border-slate-700/50 backdrop-blur-md shadow-2xl'
          : theme === 'dark'
          ? 'bg-[#0b0f19] border-slate-800 shadow-xl'
          : 'bg-white border-slate-200 shadow-lg'
      }`}
    >
      {/* Dynamic OHLCV Floating Coordinate Ribbon */}
      <div className="absolute top-2 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-none text-xs font-mono">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm">
          <span className="font-bold text-white tracking-wider">{symbol}</span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {timeframe}
          </span>
        </div>

        {activeCandle && (
          <div className="flex items-center gap-2 text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm text-slate-300">
            <span>
              O: <strong className="text-white">{activeCandle.open.toFixed(decimals)}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-400">{activeCandle.high.toFixed(decimals)}</strong>
            </span>
            <span>
              L: <strong className="text-rose-400">{activeCandle.low.toFixed(decimals)}</strong>
            </span>
            <span>
              C: <strong className="text-white">{activeCandle.close.toFixed(decimals)}</strong>
            </span>
            <span className="text-slate-400">
              Vol:{' '}
              <strong className="text-indigo-300">
                {(activeCandle.volume || 0).toLocaleString()}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Floating Quick Action Overlay Buttons (Top Right of Chart) */}
      <div className="absolute top-2 right-20 z-10 flex items-center gap-1.5">
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 backdrop-blur-sm transition text-xs flex items-center gap-1"
          title="Reset chart view zoom & pan"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={handleToggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 backdrop-blur-sm transition"
          title="Toggle Fullscreen Chart"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Master Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Custom Context Menu Overlay */}
      {contextMenu && (
        <div
          className="fixed z-50 w-52 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-1.5 backdrop-blur-md text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu(null)}
        >
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 mb-1">
            Price: {contextMenu.price.toFixed(decimals)}
          </div>

          {onExecuteQuickOrder && (
            <>
              <button
                onClick={() => onExecuteQuickOrder('BUY', contextMenu.price)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-emerald-600/20 text-emerald-400 font-bold transition text-left cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Buy Market @ {contextMenu.price.toFixed(decimals)}</span>
              </button>
              <button
                onClick={() => onExecuteQuickOrder('SELL', contextMenu.price)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-600/20 text-rose-400 font-bold transition text-left cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Sell Market @ {contextMenu.price.toFixed(decimals)}</span>
              </button>
            </>
          )}

          {onOpenAlertModalAtPrice && (
            <button
              onClick={() => onOpenAlertModalAtPrice(contextMenu.price)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition text-left cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Alert @ {contextMenu.price.toFixed(decimals)}</span>
            </button>
          )}

          {onStartReplayFromCandle && (
            <button
              onClick={() => onStartReplayFromCandle(contextMenu.candleIndex)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 text-indigo-400 font-bold transition text-left cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Start Replay from here</span>
            </button>
          )}

          <div className="border-t border-slate-800 my-1" />

          <button
            onClick={() => {
              const newDrawing: ChartDrawing = {
                id: 'draw-' + Date.now(),
                type: 'HORIZONTAL_LINE',
                points: [{ time: candles[contextMenu.candleIndex]?.time || 0, price: contextMenu.price }],
                color: '#38bdf8',
                lineWidth: 2,
                lineStyle: 'solid',
                opacity: 1,
              };
              onUpdateDrawings([...drawings, newDrawing]);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition text-left cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Horizontal Line</span>
          </button>

          <button
            onClick={handleResetView}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition text-left cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Chart View</span>
          </button>

          {drawings.length > 0 && (
            <button
              onClick={() => onUpdateDrawings([])}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All Drawings</span>
            </button>
          )}

          {onOpenSettingsModal && (
            <button
              onClick={onOpenSettingsModal}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition text-left cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Chart Settings...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
