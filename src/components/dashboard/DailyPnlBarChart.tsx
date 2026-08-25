import React, { useState, useMemo } from 'react';
import { Trade } from '../../types';
import { useTrading } from '../../context/TradingContext';

interface DailyPnlBarChartProps {
  trades: Trade[];
  formatCurrency: (val: number) => string;
}

interface BarData {
  dateKey: string;
  displayDate: string;
  pnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
}

export const DailyPnlBarChart: React.FC<DailyPnlBarChartProps> = ({ trades, formatCurrency }) => {
  const { theme } = useTrading();
  const [hoveredBar, setHoveredBar] = useState<BarData | null>(null);

  const isLight = theme === 'light';

  // Group trades by date
  const bars: BarData[] = useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED');
    if (closed.length === 0) return [];

    const map: { [dateStr: string]: { pnl: number; count: number; wins: number; losses: number; rawDate: string } } = {};

    closed.forEach(t => {
      if (!t.entryDate) return;
      const d = t.entryDate.split('T')[0];
      if (!map[d]) {
        map[d] = { pnl: 0, count: 0, wins: 0, losses: 0, rawDate: t.entryDate };
      }
      map[d].pnl += t.netPnl;
      map[d].count += 1;
      if (t.netPnl > 0) map[d].wins += 1;
      else if (t.netPnl < 0) map[d].losses += 1;
    });

    const sortedDates = Object.keys(map).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(d => {
      const dateObj = new Date(map[d].rawDate);
      return {
        dateKey: d,
        displayDate: dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
        pnl: map[d].pnl,
        tradeCount: map[d].count,
        wins: map[d].wins,
        losses: map[d].losses,
      };
    });
  }, [trades]);

  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[210px] text-slate-500 text-xs">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <span className="text-slate-400 font-mono">📊</span>
        </div>
        <span>No daily trade distribution available</span>
      </div>
    );
  }

  const maxAbs = Math.max(150, ...bars.map(b => Math.abs(b.pnl)));

  return (
    <div className="relative w-full h-[220px] flex flex-col justify-between select-none">
      {/* Bars Container */}
      <div className="flex-1 flex items-center justify-between gap-1.5 px-3 pt-4 pb-2">
        {bars.map((bar, idx) => {
          const isPos = bar.pnl >= 0;
          const heightPercent = Math.max(8, (Math.abs(bar.pnl) / maxAbs) * 85);

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center h-full relative group cursor-pointer"
              onMouseEnter={() => setHoveredBar(bar)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Split Upper & Lower for zero-centered bars */}
              <div className="w-full h-full flex flex-col justify-center items-center">
                {/* Positive (Top) */}
                {isPos ? (
                  <div className="w-full flex flex-col items-center justify-end h-1/2">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[16px] rounded-t-sm transition-all shadow-sm bg-emerald-500 group-hover:bg-emerald-400"
                    />
                  </div>
                ) : (
                  <div className="w-full h-1/2" />
                )}

                {/* Zero baseline line */}
                <div className={`w-full h-[1px] ${isLight ? 'bg-zinc-300' : 'bg-zinc-800'}`} />

                {/* Negative (Bottom) */}
                {!isPos ? (
                  <div className="w-full flex flex-col items-center justify-start h-1/2">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[16px] rounded-b-sm transition-all shadow-sm bg-rose-500 group-hover:bg-rose-400"
                    />
                  </div>
                ) : (
                  <div className="w-full h-1/2" />
                )}
              </div>

              {/* Date label */}
              <span className={`text-[9px] mt-1 font-mono ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {bar.displayDate}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredBar && (
        <div
          className={`absolute top-1 right-4 px-3 py-1.5 rounded-lg text-xs z-20 pointer-events-none animate-in fade-in ${
            isLight
              ? 'bg-white border border-zinc-200 text-zinc-900 shadow-xl'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-2xl'
          }`}
        >
          <div className="text-[10px] font-semibold flex items-center justify-between gap-3 text-zinc-400">
            <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>{hoveredBar.dateKey}</span>
            <span className={`${isLight ? 'text-zinc-600' : 'text-zinc-400'} font-mono`}>{hoveredBar.tradeCount} trades</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 font-mono">
            <span className={`${isLight ? 'text-zinc-600' : 'text-zinc-400'} text-[11px]`}>Net P&L:</span>
            <span className={`text-[12px] font-bold ${hoveredBar.pnl >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
              {formatCurrency(hoveredBar.pnl)}
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
            <span className={isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}>{hoveredBar.wins}W</span>
            <span>-</span>
            <span className={isLight ? 'text-rose-700 font-semibold' : 'text-rose-400'}>{hoveredBar.losses}L</span>
          </div>
        </div>
      )}

      {/* Bottom Summary Bar */}
      <div className={`flex justify-between px-3 text-[10px] border-t pt-1 font-mono ${
        isLight ? 'text-zinc-600 border-zinc-200' : 'text-zinc-400 border-zinc-800'
      }`}>
        <span>{bars.length} Trading Days</span>
        <span className={isLight ? 'text-zinc-700' : 'text-zinc-300'}>
          Max Day: <strong className="text-emerald-400">+{formatCurrency(Math.round(maxAbs))}</strong>
        </span>
      </div>
    </div>
  );
};
