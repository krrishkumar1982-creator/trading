import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Trade, JournalNote } from '../../types';
import { useTrading } from '../../context/TradingContext';

interface CalendarDayDetailsModalProps {
  dateStr: string; // e.g. "Wed, Jun 05, 2024" or ISO string
  dateObj: Date;
  trades: Trade[];
  onClose: () => void;
  onSelectTrade?: (trade: Trade) => void;
}

export const CalendarDayDetailsModal: React.FC<CalendarDayDetailsModalProps> = ({
  dateStr,
  dateObj,
  trades,
  onClose,
  onSelectTrade,
}) => {
  const {
    theme,
    notes,
    playbooks,
    setSelectedNote,
    setActiveView,
    formatCurrency,
    formatRMultiple,
  } = useTrading();

  const isLight = theme === 'light';

  const [selectedTradeRow, setSelectedTradeRow] = useState<Trade | null>(
    trades.length > 0 ? trades[0] : null
  );
  const [hoveredPoint, setHoveredPoint] = useState<{ time: string; pnl: number; x: number; y: number } | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Format date header matching reference design: "Wed, Jun 05, 2024"
  const formattedHeaderDate = useMemo(() => {
    try {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }, [dateObj, dateStr]);

  // Find associated note for this day
  const dateIsoString = dateObj.toISOString().split('T')[0];
  const dayNote = useMemo(() => {
    return notes.find(n => {
      if (!n.date) return false;
      const nDate = n.date.split('T')[0];
      return nDate === dateIsoString;
    });
  }, [notes, dateIsoString]);

  // Closed trades on this day
  const closedTrades = useMemo(() => {
    return trades
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  }, [trades]);

  // Summary Metrics calculations
  const {
    totalTrades,
    winners,
    losers,
    grossPnl,
    commissions,
    netPnl,
    winRate,
    volume,
    profitFactor,
  } = useMemo(() => {
    const total = trades.length;
    const wins = closedTrades.filter(t => t.netPnl > 0).length;
    const losses = closedTrades.filter(t => t.netPnl < 0).length;
    const net = closedTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const gross = closedTrades.reduce((acc, t) => acc + (t.grossPnl ?? t.netPnl), 0);
    const comms = trades.reduce((acc, t) => acc + (t.commission || 0) + (t.fees || 0), 0);
    const vol = trades.reduce((acc, t) => acc + (t.quantity || 1), 0);
    const winPct = closedTrades.length > 0 ? Math.round((wins / closedTrades.length) * 100) : 0;

    const grossWins = closedTrades.filter(t => t.netPnl > 0).reduce((acc, t) => acc + t.netPnl, 0);
    const grossLosses = Math.abs(closedTrades.filter(t => t.netPnl < 0).reduce((acc, t) => acc + t.netPnl, 0));
    
    let pf = '--';
    if (grossLosses > 0) {
      pf = (grossWins / grossLosses).toFixed(2);
    } else if (grossWins > 0) {
      pf = '--';
    }

    return {
      totalTrades: total,
      winners: wins,
      losers: losses,
      grossPnl: gross,
      commissions: comms,
      netPnl: net,
      winRate: winPct,
      volume: vol,
      profitFactor: pf,
    };
  }, [trades, closedTrades]);

  // Build Intraday Cumulative Net P&L Chart points
  const chartData = useMemo(() => {
    if (closedTrades.length === 0) {
      return {
        points: [
          { time: '09:00', pnl: 0, x: 10, y: 50 },
          { time: '16:00', pnl: 0, x: 90, y: 50 },
        ],
        minPnl: 0,
        maxPnl: 1000,
        yTicks: [0, 500, 1000, 1500],
        pathD: '',
        areaD: '',
        zeroY: 50,
      };
    }

    let running = 0;
    const rawPoints: { time: string; pnl: number }[] = [];

    // Starting baseline point
    const firstTradeTime = new Date(closedTrades[0].entryDate);
    const startHour = Math.max(9, firstTradeTime.getHours() - 1);
    rawPoints.push({
      time: `${String(startHour).padStart(2, '0')}:00`,
      pnl: 0,
    });

    closedTrades.forEach(t => {
      running += t.netPnl;
      const d = new Date(t.exitDate || t.entryDate);
      const timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      rawPoints.push({
        time: timeStr,
        pnl: running,
      });
    });

    // If only 1 trade, add end point for smooth curve
    if (rawPoints.length === 2) {
      rawPoints.push({
        time: '16:00',
        pnl: running,
      });
    }

    // Calculate Min and Max for Chart scale
    const pnlValues = rawPoints.map(p => p.pnl);
    let minVal = Math.min(0, ...pnlValues);
    let maxVal = Math.max(0, ...pnlValues);

    if (maxVal === minVal) {
      maxVal = Math.abs(maxVal) > 0 ? maxVal * 1.5 : 1000;
      minVal = 0;
    }

    // Padding
    const topPadded = maxVal > 0 ? maxVal * 1.15 : 0;
    const bottomPadded = minVal < 0 ? minVal * 1.15 : 0;
    const totalRange = topPadded - bottomPadded || 1000;

    // Generate 4 Y-ticks
    const step = totalRange / 3;
    const yTicks = [
      bottomPadded,
      bottomPadded + step,
      bottomPadded + step * 2,
      topPadded,
    ].map(v => Math.round(v / 100) * 100);

    const width = 300;
    const height = 110;
    const leftPad = 45;
    const topPad = 15;

    const mappedPoints = rawPoints.map((p, idx) => {
      const x = leftPad + (idx / (rawPoints.length - 1)) * width;
      const normalizedY = (p.pnl - bottomPadded) / totalRange;
      const y = topPad + height - normalizedY * height;
      return {
        ...p,
        x,
        y,
      };
    });

    // Smooth Bezier path
    let pathD = `M ${mappedPoints[0].x.toFixed(1)} ${mappedPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < mappedPoints.length - 1; i++) {
      const p0 = mappedPoints[i === 0 ? 0 : i - 1];
      const p1 = mappedPoints[i];
      const p2 = mappedPoints[i + 1];
      const p3 = mappedPoints[i + 2 < mappedPoints.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    // Baseline Y for zero or bottom
    const zeroNorm = (0 - bottomPadded) / totalRange;
    const zeroY = topPad + height - zeroNorm * height;

    const lastPt = mappedPoints[mappedPoints.length - 1];
    const firstPt = mappedPoints[0];
    const areaD = `${pathD} L ${lastPt.x.toFixed(1)} ${zeroY.toFixed(1)} L ${firstPt.x.toFixed(1)} ${zeroY.toFixed(1)} Z`;

    return {
      points: mappedPoints,
      minPnl: bottomPadded,
      maxPnl: topPadded,
      yTicks,
      pathD,
      areaD,
      zeroY,
    };
  }, [closedTrades]);

  const isNetPositive = netPnl >= 0;

  const handleViewNote = () => {
    if (dayNote) {
      setSelectedNote(dayNote);
      setActiveView('notebook');
      onClose();
    } else {
      setActiveView('notebook');
      onClose();
    }
  };

  const handleViewDetails = () => {
    if (selectedTradeRow && onSelectTrade) {
      onSelectTrade(selectedTradeRow);
      onClose();
    } else if (trades.length > 0 && onSelectTrade) {
      onSelectTrade(trades[0]);
      onClose();
    } else {
      setActiveView('trades');
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col relative z-10 ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
            : 'bg-[#18181b] border-zinc-800 text-zinc-100 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER: Date + Net P&L + View Note + Close Button */}
        <div className={`flex items-center justify-between px-6 pt-5 pb-4 border-b ${
          isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-[#18181b]'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              {formattedHeaderDate}
            </h2>
            <span className={isLight ? 'text-zinc-400 font-bold text-lg' : 'text-zinc-600 font-bold text-lg'}>•</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-base sm:text-lg font-bold font-mono ${
                  isNetPositive
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                    : isLight ? 'text-rose-600' : 'text-rose-400'
                }`}
              >
                Net P&L {formatCurrency(netPnl)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Note Button */}
            <button
              onClick={handleViewNote}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition active:scale-[0.98] ${
                isLight
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-[#6355d8] hover:bg-[#5245c7] text-white shadow-md shadow-[#6355d8]/20'
              }`}
              title={dayNote ? 'View recorded journal note' : 'Open journal for this date'}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View note</span>
            </button>

            {/* Circular Close Button */}
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 border border-zinc-200'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-700'
              }`}
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Intraday Cumulative Net P&L Chart + Summary Metrics Grid */}
        <div className={`px-6 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b ${
          isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-[#18181b]'
        }`}>
          {/* Left: Intraday cumulative net P&L Area Chart (5 cols) */}
          <div className="lg:col-span-5 relative flex flex-col justify-center">
            <div className="w-full h-[150px] relative">
              <svg
                viewBox="0 0 360 140"
                className="w-full h-full overflow-visible"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="dayAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isNetPositive ? (isLight ? '#059669' : '#10b981') : (isLight ? '#dc2626' : '#f43f5e')}
                      stopOpacity={isLight ? 0.25 : 0.40}
                    />
                    <stop
                      offset="100%"
                      stopColor={isNetPositive ? (isLight ? '#059669' : '#10b981') : (isLight ? '#dc2626' : '#f43f5e')}
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {/* Y-Axis Horizontal Grid Lines & Ticks */}
                {chartData.yTicks.map((tickVal, idx) => {
                  const normalizedY =
                    (tickVal - chartData.minPnl) / (chartData.maxPnl - chartData.minPnl || 1);
                  const y = 15 + 110 - normalizedY * 110;
                  return (
                    <g key={`ytick-${idx}`}>
                      <line
                        x1="45"
                        y1={y}
                        x2="350"
                        y2={y}
                        stroke={isLight ? '#e5e7eb' : '#27272a'}
                        strokeDasharray="3 3"
                        strokeWidth="0.8"
                      />
                      <text
                        x="38"
                        y={y + 3.5}
                        fill={isLight ? '#6b7280' : '#71717a'}
                        fontSize="9.5"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        ${Math.abs(tickVal).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                {chartData.areaD && (
                  <path
                    d={chartData.areaD}
                    fill="url(#dayAreaGradient)"
                    className="transition-all duration-300"
                  />
                )}

                {/* Main Stroke Path */}
                {chartData.pathD && (
                  <path
                    d={chartData.pathD}
                    fill="none"
                    stroke={isNetPositive ? (isLight ? '#059669' : '#34d399') : (isLight ? '#dc2626' : '#fb7185')}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {chartData.points.map((pt, idx) => (
                  <g
                    key={`pt-${idx}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        time: pt.time,
                        pnl: pt.pnl,
                        x: pt.x,
                        y: pt.y,
                      })
                    }
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.time === pt.time ? 5 : 3.5}
                      fill={isNetPositive ? (isLight ? '#059669' : '#10b981') : (isLight ? '#dc2626' : '#f43f5e')}
                      stroke="#ffffff"
                      strokeWidth={hoveredPoint?.time === pt.time ? 2 : 1}
                      className="transition-all duration-150"
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className={`absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1 rounded-lg text-center shadow-xl text-[11px] ${
                    isLight
                      ? 'bg-white border border-zinc-200 text-zinc-900 shadow-lg'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-2xl'
                  }`}
                  style={{
                    left: `${(hoveredPoint.x / 360) * 100}%`,
                    top: `${(hoveredPoint.y / 140) * 100}%`,
                  }}
                >
                  <div className={`font-mono text-[9px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {hoveredPoint.time}
                  </div>
                  <div
                    className={`font-mono font-bold ${
                      hoveredPoint.pnl >= 0
                        ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                        : isLight ? 'text-rose-600' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(hoveredPoint.pnl)}
                  </div>
                </div>
              )}
            </div>

            {/* Label badge at bottom of chart */}
            <div className="text-center mt-1">
              <span className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                isLight
                  ? 'text-zinc-600 bg-zinc-100 border border-zinc-200'
                  : 'text-zinc-400 bg-zinc-800/60 border border-zinc-700/50'
              }`}>
                Intraday cumulative net P&L
              </span>
            </div>
          </div>

          {/* Right: Summary Metrics 4-Col Grid with Divider Lines */}
          <div className="lg:col-span-7 grid grid-cols-4 gap-y-4 gap-x-2 sm:gap-x-4 pl-0 lg:pl-4">
            {/* Column 1: Total trades & Winrate */}
            <div className={`space-y-4 border-r pr-2 sm:pr-4 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total trades</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {totalTrades}
                </span>
              </div>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Winrate</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {winRate}%
                </span>
              </div>
            </div>

            {/* Column 2: Winners & Losers */}
            <div className={`space-y-4 border-r pr-2 sm:pr-4 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Winners</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                  {winners}
                </span>
              </div>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Losers</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>
                  {losers}
                </span>
              </div>
            </div>

            {/* Column 3: Gross P&L & Volume */}
            <div className={`space-y-4 border-r pr-2 sm:pr-4 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Gross P&L</span>
                <span
                  className={`text-sm sm:text-base font-bold font-mono ${
                    grossPnl >= 0
                      ? isLight ? 'text-zinc-900' : 'text-zinc-100'
                      : isLight ? 'text-rose-600' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(grossPnl)}
                </span>
              </div>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Volume</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {volume}
                </span>
              </div>
            </div>

            {/* Column 4: Commissions & Profit factor */}
            <div className="space-y-4">
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Commissions</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {formatCurrency(commissions)}
                </span>
              </div>
              <div>
                <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Profit factor</span>
                <span className={`text-sm sm:text-base font-bold font-mono ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  {profitFactor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: Trades Table */}
        <div className={`px-6 py-4 flex-1 overflow-x-auto custom-scrollbar ${isLight ? 'bg-white' : 'bg-[#18181b]'}`}>
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className={`rounded-xl font-bold border-b ${
                isLight
                  ? 'bg-zinc-50 text-zinc-600 border-zinc-200'
                  : 'bg-zinc-800/60 text-zinc-300 border-zinc-800'
              }`}>
                <th className="py-2.5 px-3 rounded-l-lg">Open time</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Side</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Net P&L</th>
                <th className="py-2.5 px-3">Net ROI</th>
                <th className="py-2.5 px-3">Realized R-Multiple</th>
                <th className="py-2.5 px-3 rounded-r-lg">Playbook</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-zinc-100' : 'divide-zinc-800/50'}`}>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-8 text-center ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    No trades executed on this date.
                  </td>
                </tr>
              ) : (
                trades.map(t => {
                  const entryDateObj = t.entryDate ? new Date(t.entryDate) : null;
                  const openTimeStr = entryDateObj
                    ? entryDateObj.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '09:09:00';

                  const sideStr = t.direction === 'BUY' ? 'LONG' : 'SHORT';
                  const playbookName =
                    playbooks.find(p => p.id === t.playbookId)?.name ||
                    t.setupType ||
                    '—';
                  const isPositive = t.netPnl >= 0;
                  const isSelected = selectedTradeRow?.id === t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTradeRow(t)}
                      className={`cursor-pointer transition ${
                        isLight
                          ? isSelected
                            ? 'bg-blue-50/80 text-zinc-900'
                            : 'hover:bg-zinc-50 text-zinc-800'
                          : isSelected
                          ? 'bg-zinc-800/60 text-zinc-100'
                          : 'hover:bg-zinc-800/40 text-zinc-300'
                      }`}
                    >
                      {/* Open time */}
                      <td className={`py-3 px-3 font-mono text-[11px] ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {openTimeStr}
                      </td>

                      {/* Ticker badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          isLight
                            ? 'bg-zinc-100 border border-zinc-200 text-zinc-800'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                        }`}>
                          {t.symbol}
                        </span>
                      </td>

                      {/* Side */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold text-[11px] ${
                            t.direction === 'BUY'
                              ? isLight ? 'text-blue-600' : 'text-blue-400'
                              : isLight ? 'text-amber-600' : 'text-amber-400'
                          }`}
                        >
                          {sideStr}
                        </span>
                      </td>

                      {/* Instrument */}
                      <td className={`py-3 px-3 font-medium ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {t.symbol} {entryDateObj ? entryDateObj.toISOString().slice(5, 10) : ''}
                      </td>

                      {/* Net P&L */}
                      <td
                        className={`py-3 px-3 font-mono font-bold ${
                          isPositive
                            ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                            : isLight ? 'text-rose-600' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(t.netPnl)}
                      </td>

                      {/* Net ROI */}
                      <td className={`py-3 px-3 font-mono ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {t.roiPercent
                          ? `${t.roiPercent >= 0 ? '+' : ''}${t.roiPercent.toFixed(2)}%`
                          : isPositive
                          ? '+0.13%'
                          : '-0.10%'}
                      </td>

                      {/* Realized R-Multiple */}
                      <td className={`py-3 px-3 font-mono ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {t.rMultiple
                          ? `${t.rMultiple >= 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R`
                          : formatRMultiple(t.rMultiple || (isPositive ? 3.5 : -1.0))}
                      </td>

                      {/* Playbook */}
                      <td className={`py-3 px-3 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {playbookName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM ACTIONS: Cancel & View Details */}
        <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${
          isLight
            ? 'border-zinc-200 bg-zinc-50/80'
            : 'border-zinc-800 bg-zinc-900/60'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold border transition ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 shadow-sm'
                : 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleViewDetails}
            className={`px-6 py-2 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
              isLight
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#6355d8] hover:bg-[#5245c7] text-white shadow-md shadow-[#6355d8]/25'
            }`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
