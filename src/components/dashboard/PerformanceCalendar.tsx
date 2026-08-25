import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Camera,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Trade } from '../../types';
import { useTrading } from '../../context/TradingContext';
import { CalendarDayDetailsModal } from './CalendarDayDetailsModal';

interface PerformanceCalendarProps {
  trades: Trade[];
  formatCurrency: (val: number) => string;
  formatRMultiple?: (r: number) => string;
  onSelectTrade?: (trade: Trade) => void;
}

export const PerformanceCalendar: React.FC<PerformanceCalendarProps> = ({
  trades,
  formatCurrency,
  formatRMultiple,
  onSelectTrade,
}) => {
  const { theme, setIsAddTradeOpen } = useTrading();
  const isLight = theme === 'light';

  // Calendar Month Navigation State
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // If trades exist, default to the most recent trade's month
    if (trades.length > 0) {
      const sorted = [...trades].sort(
        (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      );
      return new Date(sorted[0].entryDate);
    }
    return new Date();
  });

  // State for Deep Day Details Modal
  const [selectedDayTrades, setSelectedDayTrades] = useState<{
    date: string;
    dateObj: Date;
    trades: Trade[];
  } | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0 - 11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map closed trades by Day of current Month
  const { tradesByDay, monthNetPnl, tradingDaysCount } = useMemo(() => {
    const map: { [day: number]: Trade[] } = {};
    let totalPnl = 0;
    const activeDaysSet = new Set<number>();

    trades.forEach(t => {
      if (!t.entryDate) return;
      const d = new Date(t.entryDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
        if (t.status === 'CLOSED') {
          totalPnl += t.netPnl;
        }
        activeDaysSet.add(day);
      }
    });

    return {
      tradesByDay: map,
      monthNetPnl: totalPnl,
      tradingDaysCount: activeDaysSet.size,
    };
  }, [trades, year, month]);

  // Compute 6 weeks grid structure + weekly aggregates
  const { weeks, daysInMonth } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const weeksList: Array<{
      weekNumber: number;
      days: Array<{ dayNum: number | null; inMonth: boolean }>;
      weekPnl: number;
      activeDaysCount: number;
    }> = [];

    let currentDayCounter = 1 - firstDayIndex;
    for (let w = 0; w < 6; w++) {
      const daysRow: Array<{ dayNum: number | null; inMonth: boolean }> = [];
      let weekPnl = 0;
      let activeDaysCount = 0;

      for (let d = 0; d < 7; d++) {
        if (currentDayCounter >= 1 && currentDayCounter <= totalDaysInMonth) {
          const dNum = currentDayCounter;
          daysRow.push({ dayNum: dNum, inMonth: true });
          const dTrades = tradesByDay[dNum] || [];
          const closed = dTrades.filter(t => t.status === 'CLOSED');
          if (closed.length > 0) {
            activeDaysCount++;
            weekPnl += closed.reduce((acc, t) => acc + t.netPnl, 0);
          }
        } else {
          daysRow.push({ dayNum: null, inMonth: false });
        }
        currentDayCounter++;
      }

      // Calculate calendar week number
      const sampleDayNum = daysRow.find(d => d.inMonth && d.dayNum !== null)?.dayNum || 1;
      const targetDate = new Date(year, month, sampleDayNum);
      const startOfYear = new Date(year, 0, 1);
      const pastDaysOfYear = (targetDate.getTime() - startOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

      // Only add row if at least one day is in month
      if (daysRow.some(d => d.inMonth)) {
        weeksList.push({
          weekNumber,
          days: daysRow,
          weekPnl,
          activeDaysCount,
        });
      }
    }

    return { weeks: weeksList, daysInMonth: totalDaysInMonth };
  }, [year, month, tradesByDay]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleThisMonth = () => {
    setCurrentMonth(new Date());
  };

  // Currency Formatter with K suffix for compact display
  const formatCompactCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000) {
      return `${sign}$${(absVal / 1000).toFixed(2).replace(/\.00$/, '')}K`;
    }
    return `${sign}$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition flex flex-col justify-between select-none ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-900'
          : 'bg-zinc-900 border-zinc-800 text-zinc-100'
      }`}
    >
      {/* Calendar Top Navigation Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b mb-3 ${
        isLight ? 'border-zinc-200' : 'border-zinc-800'
      }`}>
        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className={`p-1 rounded-lg transition ${
              isLight
                ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className={`text-sm sm:text-base font-bold min-w-[130px] text-center tracking-tight ${
            isLight ? 'text-zinc-900' : 'text-zinc-100'
          }`}>
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className={`p-1 rounded-lg transition ${
              isLight
                ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleThisMonth}
            className={`ml-2 text-xs font-semibold px-3 py-1 rounded-lg border transition shadow-xs ${
              isLight
                ? 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                : 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            This month
          </button>
        </div>

        {/* Right Header Stats & Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? 'text-zinc-500 font-medium' : 'text-zinc-400 font-medium'}>
              Monthly stats:
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                monthNetPnl >= 0
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : isLight
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}
            >
              {formatCompactCurrency(monthNetPnl)}
            </span>
            <span className={`font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {tradingDaysCount} {tradingDaysCount === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className={`flex items-center gap-1 ${isLight ? 'text-zinc-400' : 'text-zinc-400'}`}>
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className={`p-1 rounded transition ${
                isLight ? 'hover:bg-zinc-100 hover:text-zinc-800' : 'hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Add Trade"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              className={`p-1 rounded transition ${
                isLight ? 'hover:bg-zinc-100 hover:text-zinc-800' : 'hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Calendar Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              className={`p-1 rounded transition ${
                isLight ? 'hover:bg-zinc-100 hover:text-zinc-800' : 'hover:bg-zinc-800 hover:text-zinc-200'
              }`}
              title="Snapshot View"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <span
              className={`cursor-pointer ${
                isLight ? 'hover:text-zinc-800' : 'hover:text-zinc-200'
              }`}
              title="Trading Calendar Analytics"
            >
              <Info className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar Body: 7 Days Grid + Right Weekly Summary Cards Column */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
        {/* Left 7-Col Calendar Grid */}
        <div className="md:col-span-10 space-y-1.5">
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className={`text-[11px] font-semibold py-1 uppercase tracking-wider ${
                  isLight ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 6 Rows of Days */}
          <div className="space-y-1.5">
            {weeks.map(week => (
              <div key={week.weekNumber} className="grid grid-cols-7 gap-1.5">
                {week.days.map((slot, dIdx) => {
                  if (!slot.inMonth || slot.dayNum === null) {
                    return (
                      <div
                        key={`empty-${week.weekNumber}-${dIdx}`}
                        className={`min-h-[76px] sm:min-h-[86px] rounded-xl border border-transparent ${
                          isLight ? 'bg-zinc-50/40' : 'bg-zinc-950/30'
                        }`}
                      />
                    );
                  }

                  const dayNum = slot.dayNum;
                  const dayTrades = tradesByDay[dayNum] || [];
                  const dayClosedTrades = dayTrades.filter(t => t.status === 'CLOSED');
                  const dayPnl = dayClosedTrades.reduce((acc, t) => acc + t.netPnl, 0);
                  const winTradesCount = dayClosedTrades.filter(t => t.netPnl > 0).length;
                  const winRate = dayClosedTrades.length
                    ? Math.round((winTradesCount / dayClosedTrades.length) * 100)
                    : 0;
                  const hasTrades = dayTrades.length > 0;
                  const isProfitable = dayPnl >= 0;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      onClick={() => {
                        if (hasTrades) {
                          setSelectedDayTrades({
                            date: `${monthNames[month]} ${dayNum}, ${year}`,
                            dateObj: new Date(year, month, dayNum),
                            trades: dayTrades,
                          });
                        }
                      }}
                      className={`min-h-[76px] sm:min-h-[86px] p-2 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group ${
                        hasTrades
                          ? isProfitable
                            ? isLight
                              ? 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500 cursor-pointer shadow-xs'
                              : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/60 cursor-pointer shadow-sm'
                            : isLight
                            ? 'bg-rose-50/90 border-rose-300 hover:border-rose-500 cursor-pointer shadow-xs'
                            : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400/60 cursor-pointer shadow-sm'
                          : isLight
                          ? 'bg-zinc-50/70 border-zinc-200 text-zinc-400'
                          : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600'
                      }`}
                    >
                      {/* Top Row: Event Icon + Day Number */}
                      <div className="flex items-center justify-between">
                        {hasTrades ? (
                          <span
                            className={`p-0.5 rounded ${
                              isLight ? 'text-zinc-600' : 'text-zinc-400'
                            }`}
                            title="Daily executions logged"
                          >
                            <CalendarIcon className="w-3.5 h-3.5 opacity-80" />
                          </span>
                        ) : (
                          <div className="w-3.5" />
                        )}

                        <span
                          className={`text-xs font-bold ${
                            hasTrades
                              ? isLight
                                ? 'text-zinc-900'
                                : 'text-zinc-100'
                              : isLight
                              ? 'text-zinc-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          {dayNum}
                        </span>
                      </div>

                      {/* Middle & Bottom: Day PnL, trade count, win rate */}
                      {hasTrades ? (
                        <div className="space-y-0.5 text-center mt-1">
                          <div
                            className={`text-xs sm:text-sm font-mono font-extrabold tracking-tight ${
                              isProfitable
                                ? isLight
                                  ? 'text-emerald-700'
                                  : 'text-emerald-400'
                                : isLight
                                ? 'text-rose-700'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatCompactCurrency(dayPnl)}
                          </div>

                          <div className={`text-[10px] font-mono leading-tight ${
                            isLight ? 'text-zinc-600' : 'text-zinc-400'
                          }`}>
                            {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}
                          </div>

                          <div className={`text-[9.5px] font-mono leading-tight ${
                            isLight ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>
                            {winRate.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <div className="h-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Weekly Summary Cards Column */}
        <div className="md:col-span-2 space-y-1.5 pt-6">
          {weeks.map(week => {
            const isPositive = week.weekPnl > 0;
            const isNegative = week.weekPnl < 0;

            return (
              <div
                key={`summary-${week.weekNumber}`}
                className={`min-h-[76px] sm:min-h-[86px] p-2.5 rounded-xl border flex flex-col justify-center text-center transition-all ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <span className={`text-[11px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Week {week.weekNumber}
                </span>

                <div
                  className={`text-xs sm:text-sm font-mono font-extrabold my-0.5 ${
                    isPositive
                      ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                      : isNegative
                      ? isLight ? 'text-rose-700' : 'text-rose-400'
                      : isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  {formatCompactCurrency(week.weekPnl)}
                </div>

                <span className={`text-[10px] font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {week.activeDaysCount} {week.activeDaysCount === 1 ? 'day' : 'days'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal for deep inspection - Rendered via createPortal */}
      {selectedDayTrades && (
        <CalendarDayDetailsModal
          dateStr={selectedDayTrades.date}
          dateObj={selectedDayTrades.dateObj}
          trades={selectedDayTrades.trades}
          onClose={() => setSelectedDayTrades(null)}
          onSelectTrade={onSelectTrade}
        />
      )}
    </div>
  );
};
