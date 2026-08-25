import React, { useState, useMemo, useRef } from 'react';
import { Trade } from '../../types';
import { useTrading } from '../../context/TradingContext';

interface CumulativePnlChartProps {
  trades: Trade[];
  formatCurrency: (val: number) => string;
}

interface DataPoint {
  dateStr: string;
  rawDate: string;
  dailyPnl: number;
  cumulativePnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

// Generate smooth cubic Bezier curve for SVG paths
function createSmoothCurve(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const CumulativePnlChart: React.FC<CumulativePnlChartProps> = ({ trades, formatCurrency }) => {
  const { theme } = useTrading();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group trades by date and calculate cumulative P&L
  const dataPoints: DataPoint[] = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    if (closed.length === 0) return [];

    const map: { [dateStr: string]: { dailyPnl: number; count: number; wins: number; losses: number; rawDate: string } } = {};

    closed.forEach(t => {
      if (!t.entryDate) return;
      const d = t.entryDate.split('T')[0];
      if (!map[d]) {
        map[d] = { dailyPnl: 0, count: 0, wins: 0, losses: 0, rawDate: t.entryDate };
      }
      map[d].dailyPnl += t.netPnl;
      map[d].count += 1;
      if (t.netPnl > 0) map[d].wins += 1;
      else if (t.netPnl < 0) map[d].losses += 1;
    });

    const sortedDates = Object.keys(map).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let runningCum = 0;
    const result: DataPoint[] = [];

    // Optional start point
    if (sortedDates.length > 0) {
      result.push({
        dateStr: 'Start',
        rawDate: map[sortedDates[0]].rawDate,
        dailyPnl: 0,
        cumulativePnl: 0,
        tradeCount: 0,
        wins: 0,
        losses: 0,
      });
    }

    sortedDates.forEach(d => {
      runningCum += map[d].dailyPnl;
      const dateObj = new Date(map[d].rawDate);
      result.push({
        dateStr: dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        rawDate: map[d].rawDate,
        dailyPnl: map[d].dailyPnl,
        cumulativePnl: runningCum,
        tradeCount: map[d].count,
        wins: map[d].wins,
        losses: map[d].losses,
      });
    });

    return result;
  }, [trades]);

  if (dataPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[210px] text-slate-500 text-xs">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <span className="text-slate-400 font-mono">📈</span>
        </div>
        <span>No closed trades to plot performance curve</span>
      </div>
    );
  }

  const isLight = theme === 'light';

  // SVG Chart Geometry
  const width = 480;
  const height = 195;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 18;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const pnlValues = dataPoints.map(d => d.cumulativePnl);
  const minVal = Math.min(0, ...pnlValues);
  const maxVal = Math.max(100, ...pnlValues);
  const range = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (dataPoints.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const zeroY = getY(0);

  // Raw point coordinates
  const coords = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.cumulativePnl) }));

  // Straight polyline points
  const linePoints = coords.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPolyPoints = `${coords[0].x.toFixed(1)},${zeroY.toFixed(1)} ${linePoints} ${coords[coords.length - 1].x.toFixed(1)},${zeroY.toFixed(1)}`;

  // Y-axis tick marks
  const yTicks = [maxVal, maxVal / 2, 0, minVal < 0 ? minVal : null].filter(
    (v): v is number => v !== null
  );

  const activeIdx = hoverIndex;
  const activePoint = activeIdx !== null ? dataPoints[activeIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[220px] flex flex-col justify-between select-none"
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const relativeX = (mouseX / rect.width) * width;
          const clampedX = Math.max(paddingLeft, Math.min(width - paddingRight, relativeX));
          const fraction = (clampedX - paddingLeft) / chartWidth;
          const closestIndex = Math.min(
            dataPoints.length - 1,
            Math.max(0, Math.round(fraction * (dataPoints.length - 1)))
          );
          setHoverIndex(closestIndex);
        }}
      >
        <defs>
          <linearGradient id="cumPnlGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isLight ? "#059669" : "#10b981"} stopOpacity={isLight ? "0.22" : "0.30"} />
            <stop offset="85%" stopColor={isLight ? "#059669" : "#10b981"} stopOpacity={isLight ? "0.03" : "0.05"} />
            <stop offset="100%" stopColor={isLight ? "#059669" : "#10b981"} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        <line
          x1={paddingLeft}
          y1={zeroY}
          x2={width - paddingRight}
          y2={zeroY}
          stroke={isLight ? 'rgba(0, 0, 0, 0.08)' : '#27272a'}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={width - paddingRight}
          y2={paddingTop}
          stroke={isLight ? 'rgba(0, 0, 0, 0.05)' : '#1f1f23'}
          strokeWidth="1"
        />
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke={isLight ? 'rgba(0, 0, 0, 0.05)' : '#1f1f23'}
          strokeWidth="1"
        />

        {/* Y Axis Numerical Labels */}
        {yTicks.map((val, idx) => (
          <text
            key={idx}
            x={paddingLeft - 8}
            y={getY(val) + 3}
            fill={isLight ? '#64748b' : '#71717a'}
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            {formatCurrency(Math.round(val))}
          </text>
        ))}

        {/* Area Fill */}
        <polygon points={areaPolyPoints} fill="url(#cumPnlGreen)" />

        {/* Main Cumulative Line */}
        <polyline
          fill="none"
          stroke={isLight ? '#059669' : '#10b981'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />

        {/* Active Hover / Highlight Point */}
        {activeIdx !== null && activePoint && (
          <g>
            {/* Crosshair */}
            <line
              x1={getX(activeIdx)}
              y1={paddingTop}
              x2={getX(activeIdx)}
              y2={height - paddingBottom}
              stroke={isLight ? '#2563eb' : '#3b82f6'}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={getX(activeIdx)}
              cy={getY(activePoint.cumulativePnl)}
              r="5"
              fill={isLight ? '#2563eb' : '#3b82f6'}
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip Card */}
      {activeIdx !== null && activePoint && (
        <div
          className={`absolute z-30 px-3 py-1.5 rounded-lg text-xs pointer-events-none transition-all duration-150 ${
            isLight
              ? 'bg-white border border-gray-200 text-gray-900 shadow-lg'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-xl'
          }`}
          style={{
            top: '4px',
            left: `${Math.min(74, Math.max(16, (getX(activeIdx) / width) * 100))}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-[10px] text-zinc-400 font-semibold border-b border-zinc-700/40 pb-0.5 flex items-center justify-between gap-3">
            <span>{activePoint.dateStr}</span>
            <span className="font-mono">{activePoint.tradeCount} trades</span>
          </div>
          <div className="mt-0.5 space-y-0.5 text-[11px] font-mono">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-400">Cumulative:</span>
              <span
                className={
                  activePoint.cumulativePnl >= 0
                    ? 'text-emerald-500 font-bold'
                    : 'text-rose-500 font-bold'
                }
              >
                {formatCurrency(activePoint.cumulativePnl)}
              </span>
            </div>
            {activePoint.dailyPnl !== 0 && (
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-zinc-400">Daily:</span>
                <span className={activePoint.dailyPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {activePoint.dailyPnl >= 0 ? '+' : ''}
                  {formatCurrency(activePoint.dailyPnl)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* X Axis Date Labels */}
      <div className="flex justify-between px-10 text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
        <span>{dataPoints[0]?.dateStr || ''}</span>
        {dataPoints.length > 2 && <span>{dataPoints[Math.floor(dataPoints.length / 2)]?.dateStr || ''}</span>}
        <span>{dataPoints[dataPoints.length - 1]?.dateStr || ''}</span>
      </div>
    </div>
  );
};
