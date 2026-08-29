import React, { useState, useMemo, useRef } from 'react';
import { Trade } from '../../types';
import { useTrading } from '../../context/TradingContext';
import { Info, TrendingDown } from 'lucide-react';

interface DrawdownChartProps {
  trades: Trade[];
  formatCurrency: (val: number) => string;
}

interface DrawdownPoint {
  dateStr: string;
  displayDate: string;
  drawdownDollar: number;
  drawdownPercent: number;
  peakEquity: number;
  currentEquity: number;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({ trades, formatCurrency }) => {
  const { theme } = useTrading();
  const [hoveredPoint, setHoveredPoint] = useState<DrawdownPoint | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group trades chronologically and calculate running Drawdown
  const { points, yTicks, maxDrawdown, dateLabels } = useMemo(() => {
    const closed = trades
      .filter(t => t.status === 'CLOSED' && t.entryDate)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    if (closed.length === 0) {
      return {
        points: [],
        yTicks: [0, -100, -200, -300, -400, -500, -600, -700, -800, -900],
        maxDrawdown: 900,
        dateLabels: ['05/01/24', '05/15/24', '06/01/24', '06/19/24'],
      };
    }

    // Daily aggregation
    const dayPnlMap: { [d: string]: number } = {};
    closed.forEach(t => {
      const d = t.entryDate.split('T')[0];
      dayPnlMap[d] = (dayPnlMap[d] || 0) + t.netPnl;
    });

    const sortedDates = Object.keys(dayPnlMap).sort();
    let runningEquity = 50000;
    let peakEquity = 50000;
    let maxDd = 0;

    const rawPoints = sortedDates.map((dateStr, idx) => {
      runningEquity += dayPnlMap[dateStr];
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddDollar = Math.max(0, peakEquity - runningEquity);
      const ddPercent = peakEquity > 0 ? (ddDollar / peakEquity) * 100 : 0;
      if (ddDollar > maxDd) maxDd = ddDollar;

      const d = new Date(dateStr);
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const year = d.getFullYear().toString().slice(-2);
      const displayDate = `${month}/${day}/${year}`;

      return {
        dateStr,
        displayDate,
        drawdownDollar: -ddDollar, // negative for underwater chart
        drawdownPercent: ddPercent,
        peakEquity,
        currentEquity: runningEquity,
      };
    });

    // Provide clean round bounds for Y-Axis (e.g. 0 down to -$900 or -$2000)
    const chartMaxDepth = Math.max(900, Math.ceil(maxDd / 100) * 100);
    const step = Math.max(100, Math.ceil(chartMaxDepth / 9 / 50) * 50);

    const ticks: number[] = [];
    for (let val = 0; val <= chartMaxDepth; val += step) {
      ticks.push(-val);
    }
    if (ticks.length < 5) {
      ticks.length = 0;
      for (let i = 0; i <= 9; i++) {
        ticks.push(-Math.round((chartMaxDepth / 9) * i));
      }
    }

    const n = rawPoints.length;
    const calculatedPoints: DrawdownPoint[] = rawPoints.map((p, idx) => {
      const x = n > 1 ? (idx / (n - 1)) * 100 : 50;
      // Y maps 0 (top = 0%) to -chartMaxDepth (bottom = 100%)
      const y = (Math.abs(p.drawdownDollar) / chartMaxDepth) * 100;
      return {
        ...p,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
    });

    // Pick 4 evenly spaced date labels
    const sampleDates: string[] = [];
    if (sortedDates.length <= 4) {
      sampleDates.push(...calculatedPoints.map(p => p.displayDate));
    } else {
      const stepIdx = (calculatedPoints.length - 1) / 3;
      for (let i = 0; i < 4; i++) {
        const pt = calculatedPoints[Math.min(calculatedPoints.length - 1, Math.round(i * stepIdx))];
        if (pt) sampleDates.push(pt.displayDate);
      }
    }

    return {
      points: calculatedPoints,
      yTicks: ticks,
      maxDrawdown: chartMaxDepth,
      dateLabels: sampleDates,
    };
  }, [trades]);

  // Generate SVG path for the underwater drawdown line & area
  const { linePath, areaPath } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    if (points.length === 1) {
      return {
        linePath: `M 0 ${points[0].y} L 100 ${points[0].y}`,
        areaPath: `M 0 0 L 0 ${points[0].y} L 100 ${points[0].y} L 100 0 Z`,
      };
    }

    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
    }

    const area = `${d} L ${points[points.length - 1].x.toFixed(1)} 0 L ${points[0].x.toFixed(1)} 0 Z`;
    return { linePath: d, areaPath: area };
  }, [points]);

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition flex flex-col justify-between relative select-none ${
        theme === 'light'
          ? 'bg-white border-[#E5E7EB]'
          : 'bg-[#0D111B] border-[#20283A]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b mb-2 ${
        theme === 'light' ? 'border-[#E5E7EB]' : 'border-[#20283A]'
      }`}>
        <h3 className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
          theme === 'light' ? 'text-[#111827]' : 'text-[#F3F6FB]'
        }`}>
          Drawdown
          <span
            className={`${theme === 'light' ? 'text-[#6B7280] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'} cursor-pointer`}
            title="Underwater equity drawdown curve showing depth and recovery from account peaks"
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </h3>

        <div className="text-xs font-mono">
          <span className={theme === 'light' ? 'text-[#6B7280]' : 'text-[#8C97AB]'}>Max DD: </span>
          <span className={`font-bold ${theme === 'light' ? 'text-[#DC2626]' : 'text-[#FF3D6E]'}`}>-${maxDrawdown.toLocaleString()}</span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[180px] sm:h-[200px] pt-1 pb-6 pl-12 pr-2 flex flex-col justify-end"
      >
        {/* Y-Axis Tick Labels (Left) */}
        <div className="absolute inset-y-1 left-0 w-11 flex flex-col justify-between pointer-events-none text-right pr-1.5">
          {yTicks.map((val, idx) => (
            <span key={idx} className={`text-[10px] font-mono truncate ${
              theme === 'light' ? 'text-[#6B7280]' : 'text-[#8C97AB]'
            }`}>
              {val === 0 ? '$0' : `-$${Math.abs(val).toLocaleString()}`}
            </span>
          ))}
        </div>

        {/* SVG Drawing Canvas */}
        <div className={`relative w-full h-full border-l border-t rounded-tl-sm overflow-hidden ${
          theme === 'light' ? 'border-[#E5E7EB]' : 'border-[#20283A]'
        }`}>
          {/* Subtle horizontal grid lines */}
          {yTicks.map((val, idx) => {
            const topPct = (Math.abs(val) / maxDrawdown) * 100;
            return (
              <div
                key={idx}
                className={`absolute left-0 right-0 border-b border-dashed ${
                  theme === 'light' ? 'border-[#E5E7EB]' : 'border-[#20283A]/50'
                }`}
                style={{ top: `${topPct}%` }}
              />
            );
          })}

          <svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF3D6E" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#FF3D6E" stopOpacity="0.30" />
              </linearGradient>
            </defs>

            {/* Filled Underwater Area */}
            {areaPath && (
              <path d={areaPath} fill="url(#drawdownGradient)" className="transition-all duration-300" />
            )}

            {/* Drawdown Depth Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#FF3D6E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-300"
              />
            )}
          </svg>

          {/* Invisible hover detectors for smooth data inspection */}
          <div className="absolute inset-0 flex">
            {points.map((pt, idx) => (
              <div
                key={idx}
                className="flex-1 h-full cursor-crosshair relative group"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {hoveredPoint?.dateStr === pt.dateStr && (
                  <>
                    {/* Vertical guideline */}
                    <div
                      className="absolute top-0 bottom-0 w-[1px] bg-[#FF3D6E]/60 pointer-events-none"
                      style={{ left: '50%' }}
                    />
                    {/* Intersection Dot */}
                    <div
                      className="absolute w-2.5 h-2.5 rounded-full bg-[#FF3D6E] ring-2 ring-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: '50%',
                        top: `${pt.y}%`,
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div
              className={`absolute z-30 transform -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none p-2 rounded-lg shadow-xl border text-xs min-w-[140px] animate-in fade-in ${
                theme === 'light'
                  ? 'bg-white border-[#E5E7EB] text-[#111827]'
                  : 'bg-[#0D111B] border-[#28344A] text-[#F3F6FB]'
              }`}
              style={{
                left: `${hoveredPoint.x}%`,
                top: `${Math.max(25, hoveredPoint.y)}%`,
              }}
            >
              <div className={`text-[10px] pb-1 border-b mb-1 font-mono ${
                theme === 'light' ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
              }`}>
                {hoveredPoint.displayDate}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className={theme === 'light' ? 'text-[#6B7280]' : 'text-[#8C97AB]'}>Drawdown:</span>
                <span className={`font-mono font-bold ${theme === 'light' ? 'text-[#DC2626]' : 'text-[#FF3D6E]'}`}>
                  {formatCurrency(hoveredPoint.drawdownDollar)}
                </span>
              </div>
              <div className={`flex items-center justify-between text-[10px] ${theme === 'light' ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
                <span>Depth:</span>
                <span className={`font-mono ${theme === 'light' ? 'text-[#DC2626]' : 'text-[#FF3D6E]'}`}>-{hoveredPoint.drawdownPercent.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Date Labels (Bottom) */}
        <div className={`absolute -bottom-1 left-12 right-2 flex justify-between text-[9.5px] font-mono pt-1 pointer-events-none ${
          theme === 'light' ? 'text-[#6B7280]' : 'text-[#8C97AB]'
        }`}>
          {dateLabels.map((lbl, i) => (
            <span key={i} className="transform -translate-x-1/2">
              {lbl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
