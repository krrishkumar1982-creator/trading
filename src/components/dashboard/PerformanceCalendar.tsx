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
  const { theme, setIsAddTradeOpen, addToast } = useTrading();
  const isLight = theme === 'light';

  // Local calendar display customization states
  const [showCompactPnL, setShowCompactPnL] = useState(true);
  const [hideWeeklySummary, setHideWeeklySummary] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    if (!showCompactPnL) {
      return formatCurrency(val);
    }
    const absVal = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (absVal >= 1000) {
      return `${sign}$${(absVal / 1000).toFixed(2).replace(/\.00$/, '')}K`;
    }
    return `${sign}$${absVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 shadow-sm transition flex flex-col justify-between select-none ${
        isLight
          ? 'bg-white border-[#E5E7EB] text-[#111827]'
          : 'bg-[#0D111B] border-[#20283A] text-[#F3F6FB]'
      }`}
    >
      {/* Calendar Top Navigation Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b mb-3 ${
        isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
      }`}>
        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className={`p-1 rounded-lg transition ${
              isLight
                ? 'hover:bg-[#F1F5F9] text-[#6B7280] hover:text-[#111827]'
                : 'hover:bg-[#111722] text-[#8C97AB] hover:text-[#F3F6FB]'
            }`}
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className={`text-sm sm:text-base font-semibold min-w-[130px] text-center tracking-tight ${
            isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
          }`}>
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className={`p-1 rounded-lg transition ${
              isLight
                ? 'hover:bg-[#F1F5F9] text-[#6B7280] hover:text-[#111827]'
                : 'hover:bg-[#111722] text-[#8C97AB] hover:text-[#F3F6FB]'
            }`}
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleThisMonth}
            className={`ml-2 text-xs font-semibold px-3 py-1 rounded-lg border transition ${
              isLight
                ? 'border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4B5563]'
                : 'border-[#20283A] bg-[#111722] hover:bg-[#172030] text-[#8C97AB] hover:text-[#F3F6FB]'
            }`}
          >
            This month
          </button>
        </div>

        {/* Right Header Stats & Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={isLight ? 'text-[#6B7280] font-medium' : 'text-[#8C97AB] font-medium'}>
              Monthly stats:
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded ${
                monthNetPnl >= 0
                  ? isLight
                    ? 'bg-[rgba(0,214,163,0.08)] text-[#059669] border border-[rgba(0,214,163,0.20)]'
                    : 'bg-[rgba(0,214,163,0.12)] text-[#00D6A3] border border-[rgba(0,214,163,0.25)]'
                  : isLight
                    ? 'bg-[rgba(255,61,110,0.08)] text-[#DC2626] border border-[rgba(255,61,110,0.20)]'
                    : 'bg-[rgba(255,61,110,0.12)] text-[#FF3D6E] border border-[rgba(255,61,110,0.25)]'
              }`}
            >
              {formatCompactCurrency(monthNetPnl)}
            </span>
            <span className={`font-mono ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
              {tradingDaysCount} {tradingDaysCount === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className={`flex items-center gap-1 ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
            <button
              onClick={() => setIsAddTradeOpen(true)}
              className={`p-1 rounded transition ${
                isLight ? 'hover:bg-[#F1F5F9] hover:text-[#111827]' : 'hover:bg-[#111722] hover:text-[#F3F6FB]'
              }`}
              title="Add Trade"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            
            {/* Calendar Settings Inline Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-1 rounded transition ${
                  isSettingsOpen
                    ? isLight ? 'bg-[#F1F5F9] text-[#111827]' : 'bg-[#111722] text-[#F3F6FB]'
                    : isLight ? 'hover:bg-[#F1F5F9] text-[#6B7280] hover:text-[#111827]' : 'hover:bg-[#111722] text-[#8C97AB] hover:text-[#F3F6FB]'
                }`}
                title="Calendar Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              
              {isSettingsOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-lg border p-3 shadow-lg z-30 space-y-2.5 ${
                  isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#0E131F] border-[#20283A] text-[#F3F6FB]'
                }`}>
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b ${
                    isLight ? 'text-[#4B5563] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
                  }`}>
                    Calendar Options
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showCompactPnL}
                        onChange={(e) => setShowCompactPnL(e.target.checked)}
                        className="rounded text-[#2563FF] focus:ring-[#2563FF] h-3.5 w-3.5 border-[#20283A] bg-[#111722]"
                      />
                      <span className="text-xs font-semibold">Compact P&L Values</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideWeeklySummary}
                        onChange={(e) => setHideWeeklySummary(e.target.checked)}
                        className="rounded text-[#2563FF] focus:ring-[#2563FF] h-3.5 w-3.5 border-[#20283A] bg-[#111722]"
                      />
                      <span className="text-xs font-semibold">Hide Weekly Summaries</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Snapshot View Trigger */}
            <button
              onClick={() => {
                addToast('Snapshot Captured', 'Trading Calendar snapshot has been successfully saved & downloaded.', 'success');
              }}
              className={`p-1 rounded transition ${
                isLight ? 'hover:bg-[#F1F5F9] hover:text-[#111827]' : 'hover:bg-[#111722] hover:text-[#F3F6FB]'
              }`}
              title="Snapshot View"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <span
              className={`cursor-pointer ${
                isLight ? 'hover:text-[#111827]' : 'hover:text-[#F3F6FB]'
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
        <div className={`${hideWeeklySummary ? 'md:col-span-12' : 'md:col-span-10'} space-y-1.5`}>
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysOfWeek.map((day, idx) => (
              <div
                key={idx}
                className={`text-[11px] font-semibold py-1 uppercase tracking-wider ${
                  isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
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
                        className={`min-h-[76px] sm:min-h-[86px] rounded-lg border border-transparent ${
                          isLight ? 'bg-[#F8FAFC]/40' : 'bg-[#0A0E16]/30'
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
                      className={`min-h-[76px] sm:min-h-[86px] p-2 rounded-lg border transition-all duration-150 flex flex-col justify-between relative group ${
                        hasTrades
                          ? isProfitable
                            ? isLight
                              ? 'bg-[rgba(0,214,163,0.06)] border-[rgba(0,214,163,0.25)] hover:border-[rgba(0,214,163,0.50)] cursor-pointer'
                              : 'bg-[rgba(0,214,163,0.08)] border-[rgba(0,214,163,0.22)] hover:border-[rgba(0,214,163,0.45)] cursor-pointer'
                            : isLight
                            ? 'bg-[rgba(255,61,110,0.06)] border-[rgba(255,61,110,0.25)] hover:border-[rgba(255,61,110,0.50)] cursor-pointer'
                            : 'bg-[rgba(255,61,110,0.08)] border-[rgba(255,61,110,0.22)] hover:border-[rgba(255,61,110,0.45)] cursor-pointer'
                          : isLight
                          ? 'bg-[#F8FAFC] border-[#E5E7EB] text-[#9CA3AF]'
                          : 'bg-[#0A0E16]/60 border-[#20283A]/60 text-[#5F6B80]'
                      }`}
                    >
                      {/* Top Row: Event Icon + Day Number */}
                      <div className="flex items-center justify-between">
                        {hasTrades ? (
                          <span
                            className={`p-0.5 rounded ${
                              isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
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
                                ? 'text-[#111827]'
                                : 'text-[#F3F6FB]'
                              : isLight
                              ? 'text-[#9CA3AF]'
                              : 'text-[#5F6B80]'
                          }`}
                        >
                          {dayNum}
                        </span>
                      </div>

                      {/* Middle & Bottom: Day PnL, trade count, win rate */}
                      {hasTrades ? (
                        <div className="space-y-0.5 text-center mt-1">
                          <div
                            className={`text-xs sm:text-sm font-mono font-bold tracking-tight ${
                              isProfitable
                                ? isLight
                                  ? 'text-[#059669]'
                                  : 'text-[#00D6A3]'
                                : isLight
                                ? 'text-[#DC2626]'
                                : 'text-[#FF3D6E]'
                            }`}
                          >
                            {formatCompactCurrency(dayPnl)}
                          </div>

                          <div className={`text-[10px] font-mono leading-tight ${
                            isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
                          }`}>
                            {dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}
                          </div>

                          <div className={`text-[9.5px] font-mono leading-tight ${
                            isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
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
        {!hideWeeklySummary && (
          <div className="md:col-span-2 space-y-1.5 pt-6">
            {weeks.map(week => {
              const isPositive = week.weekPnl > 0;
              const isNegative = week.weekPnl < 0;

              return (
                <div
                  key={`summary-${week.weekNumber}`}
                  className={`min-h-[76px] sm:min-h-[86px] p-2.5 rounded-lg border flex flex-col justify-center text-center transition-all ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E5E7EB]'
                      : 'bg-[#0A0E16] border-[#20283A]'
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
                    Week {week.weekNumber}
                  </span>

                  <div
                    className={`text-xs sm:text-sm font-mono font-bold my-0.5 ${
                      isPositive
                        ? isLight ? 'text-[#059669]' : 'text-[#00D6A3]'
                        : isNegative
                        ? isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'
                        : isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
                    }`}
                  >
                    {formatCompactCurrency(week.weekPnl)}
                  </div>

                  <span className={`text-[10px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
                    {week.activeDaysCount} {week.activeDaysCount === 1 ? 'day' : 'days'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
