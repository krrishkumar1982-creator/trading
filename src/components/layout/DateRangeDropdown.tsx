import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export interface DateRangeState {
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
  presetLabel: string;
}

interface DateRangeDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: DateRangeState;
  onSelectRange: (range: DateRangeState) => void;
}

export const PRESETS = [
  'Today',
  'This week',
  'This month',
  'Last 30 days',
  'Last month',
  'This quarter',
  'YTD (year to date)',
  'All Dates',
];

export const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({
  isOpen,
  onClose,
  selectedRange,
  onSelectRange,
}) => {
  const { theme } = useTrading();
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement>(null);

  // Active viewing months for Dual Calendar
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (selectedRange.startDate) {
      const d = new Date(selectedRange.startDate);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth() - 1, 1);
  });

  // Next month is always currentMonthDate + 1 month
  const nextMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);

  // Temporary selection state during user interaction
  const [tempStart, setTempStart] = useState<string | null>(selectedRange.startDate);
  const [tempEnd, setTempEnd] = useState<string | null>(selectedRange.endDate);
  const [activePreset, setActivePreset] = useState<string>(selectedRange.presetLabel);

  useEffect(() => {
    setTempStart(selectedRange.startDate);
    setTempEnd(selectedRange.endDate);
    setActivePreset(selectedRange.presetLabel);
  }, [selectedRange, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const computePresetRange = (preset: string) => {
    const now = new Date();
    const toYMD = (d: Date) => d.toISOString().split('T')[0];

    let start: Date | null = null;
    let end: Date | null = null;

    if (preset === 'Today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === 'This week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      start = new Date(now.setDate(diff));
      end = new Date();
    } else if (preset === 'This month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'Last 30 days') {
      start = new Date();
      start.setDate(now.getDate() - 30);
      end = new Date();
    } else if (preset === 'Last month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'This quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
    } else if (preset === 'YTD (year to date)') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date();
    } else if (preset === 'All Dates') {
      start = null;
      end = null;
    }

    const range: DateRangeState = {
      startDate: start ? toYMD(start) : null,
      endDate: end ? toYMD(end) : null,
      presetLabel: preset,
    };
    onSelectRange(range);
    onClose();
  };

  const handleDateClick = (dateStr: string) => {
    setActivePreset('Custom');
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dateStr);
      setTempEnd(null);
    } else {
      if (new Date(dateStr) < new Date(tempStart)) {
        setTempStart(dateStr);
        setTempEnd(tempStart);
        onSelectRange({
          startDate: dateStr,
          endDate: tempStart,
          presetLabel: 'Custom',
        });
        onClose();
      } else {
        setTempEnd(dateStr);
        onSelectRange({
          startDate: tempStart,
          endDate: dateStr,
          presetLabel: 'Custom',
        });
        onClose();
      }
    }
  };

  // Helper to render calendar month grid
  const renderCalendar = (monthDate: Date, isFirstMonth: boolean) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthName = monthDate.toLocaleString('default', { month: 'short' });

    // First day of month
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    // Next month padding days to fill 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateStr: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      });
    }

    return (
      <div className="w-[240px] select-none">
        {/* Month Header with controls */}
        <div className="flex items-center justify-between px-2 py-1.5 mb-2">
          {isFirstMonth ? (
            <button
              onClick={handlePrevMonth}
              className={`p-1 rounded transition ${isLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>
            <span>{monthName}</span>
            <span className={isLight ? 'text-zinc-500' : 'text-slate-400'}>{year}</span>
          </div>

          {!isFirstMonth ? (
            <button
              onClick={handleNextMonth}
              className={`p-1 rounded transition ${isLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Days of week header */}
        <div className={`grid grid-cols-7 text-center text-[10px] font-medium mb-1 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Day numbers grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {days.map((d, index) => {
            const isSelectedStart = tempStart === d.dateStr;
            const isSelectedEnd = tempEnd === d.dateStr;
            const isInRange =
              tempStart && tempEnd && new Date(d.dateStr) > new Date(tempStart) && new Date(d.dateStr) < new Date(tempEnd);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(d.dateStr)}
                className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center text-[11px] transition-colors ${
                  !d.isCurrentMonth
                    ? isLight ? 'text-zinc-300' : 'text-slate-600'
                    : isSelectedStart || isSelectedEnd
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : isInRange
                    ? isLight ? 'bg-blue-100 text-blue-800 rounded-none' : 'bg-blue-500/20 text-blue-300 rounded-none'
                    : isLight ? 'text-zinc-700 hover:bg-zinc-100' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {d.dayNumber}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`absolute top-full right-0 mt-2 z-50 rounded-2xl border shadow-2xl p-4 animate-in fade-in zoom-in-95 ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
          : 'border-slate-800 bg-slate-900 text-slate-200 shadow-2xl backdrop-blur-xl'
      }`}
      style={{ width: '640px' }}
    >
      {/* Top Header: Start Date -> End Date */}
      <div className={`flex items-center justify-between pb-3 mb-3 border-b text-xs ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
        <div className="flex items-center gap-4 flex-1">
          <div className={`flex-1 px-3 py-1.5 rounded-lg border font-mono text-center ${
            isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            {tempStart ? tempStart : 'Start Date'}
          </div>
          <span className={`font-bold ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>→</span>
          <div className={`flex-1 px-3 py-1.5 rounded-lg border font-mono text-center ${
            isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-800' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            {tempEnd ? tempEnd : 'End Date'}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`ml-3 p-1 rounded transition ${isLight ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dual Calendar + Presets Column */}
      <div className="flex gap-4">
        {/* Left Side: Dual Month Calendars */}
        <div className={`flex gap-4 border-r pr-4 ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
          {renderCalendar(currentMonthDate, true)}
          {renderCalendar(nextMonthDate, false)}
        </div>

        {/* Right Side: Quick Presets */}
        <div className="w-[140px] flex flex-col justify-start space-y-1">
          <div className={`text-[10px] font-bold uppercase tracking-wider pb-1 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
            Quick Select
          </div>
          {PRESETS.map(preset => {
            const isSelected = activePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => computePresetRange(preset)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? isLight
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/25'
                    : isLight
                      ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
