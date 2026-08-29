import React, { useState, useEffect, useMemo } from 'react';
import { Trade } from '../../types';
import { CheckSquare, Square, X, CalendarCheck2, Trophy } from 'lucide-react';
import { DashboardInfoTooltip } from './DashboardInfoTooltip';
import { useTrading } from '../../context/TradingContext';
import { fetchDailyChecklist, saveDailyChecklistItemApi, saveDailyChecklistBulkApi } from '../../services/apiClient';

interface ProgressTrackerCardProps {
  trades: Trade[];
  formatCurrency: (val: number) => string;
}

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'plan', label: 'Followed trading plan & A+ playbook setup criteria', category: 'Execution' },
  { id: 'risk', label: 'Respected max daily risk limits & position sizing', category: 'Risk' },
  { id: 'overtrade', label: 'Did not overtrade, chase price, or revenge trade', category: 'Psychology' },
  { id: 'journal', label: 'Journaled trade thesis, emotions, and exit reasons', category: 'Process' },
  { id: 'review', label: 'Reviewed daily metrics and tagged execution quality', category: 'Growth' },
];

export const ProgressTrackerCard: React.FC<ProgressTrackerCardProps> = ({
  trades,
  formatCurrency,
}) => {
  const { theme, authUser } = useTrading();
  const isLight = theme === 'light';
  const userId = authUser?.uid || null;

  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    dateStr: string;
    tradeCount: number;
    netPnl: number;
    winRate: number;
  } | null>(null);

  // Today's date string YYYY-MM-DD
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Daily checklist state
  const [completedItems, setCompletedItems] = useState<string[]>(['plan']);

  // Fetch from PostgreSQL and perform legacy localStorage migration if logged in
  useEffect(() => {
    let isMounted = true;

    async function loadAndMigrate() {
      if (!userId) {
        // Fallback for unauthenticated users
        try {
          const saved = localStorage.getItem(`df_checklist_${todayKey}`);
          if (saved && isMounted) {
            setCompletedItems(JSON.parse(saved));
          }
        } catch {
          // ignore
        }
        return;
      }

      // Fetch today's items from Cloud SQL
      const dbItems = await fetchDailyChecklist(todayKey);

      // Check migration marker
      const migrationMarker = `duskflow_checklist_cloudsql_migrated_v1_${userId}`;
      const hasMigrated = localStorage.getItem(migrationMarker);

      if (!hasMigrated) {
        try {
          // Migrate all legacy localStorage keys starting with 'df_checklist_'
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('df_checklist_')) {
              const dateStr = key.replace('df_checklist_', '');
              const valStr = localStorage.getItem(key);
              if (valStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                try {
                  const items = JSON.parse(valStr);
                  if (Array.isArray(items)) {
                    await saveDailyChecklistBulkApi(dateStr, items);
                  }
                } catch (e) {
                  console.warn('Error parsing legacy checklist key:', key, e);
                }
              }
            }
          }

          // Mark migration completed
          localStorage.setItem(migrationMarker, 'true');

          // Delete legacy localStorage keys safely
          const keysToDelete: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('df_checklist_')) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(k => localStorage.removeItem(k));

          // Load migrated data
          const freshDbItems = await fetchDailyChecklist(todayKey);
          if (isMounted) {
            setCompletedItems(freshDbItems.length > 0 ? freshDbItems : ['plan']);
          }
        } catch (err) {
          console.error('Checklist migration failed:', err);
          if (isMounted) {
            setCompletedItems(dbItems.length > 0 ? dbItems : ['plan']);
          }
        }
      } else {
        // Already migrated, use database items
        if (isMounted) {
          setCompletedItems(dbItems.length > 0 ? dbItems : ['plan']);
        }
      }
    }

    loadAndMigrate();

    return () => {
      isMounted = false;
    };
  }, [userId, todayKey]);

  const toggleItem = async (id: string) => {
    const isCompleted = completedItems.includes(id);
    const updated = isCompleted
      ? completedItems.filter(item => item !== id)
      : [...completedItems, id];

    // Optimistically update React state for instant user response
    setCompletedItems(updated);

    if (userId) {
      try {
        await saveDailyChecklistItemApi(id, todayKey, !isCompleted);
      } catch (err) {
        console.error('Failed to persist checklist toggle to Postgres:', err);
      }
    } else {
      try {
        localStorage.setItem(`df_checklist_${todayKey}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  // Group trade history by date
  const tradeMap = useMemo(() => {
    const map: { [dateStr: string]: { count: number; netPnl: number; wins: number } } = {};
    trades.forEach(t => {
      if (!t.entryDate) return;
      const dateStr = t.entryDate.split('T')[0];
      if (!map[dateStr]) {
        map[dateStr] = { count: 0, netPnl: 0, wins: 0 };
      }
      map[dateStr].count += 1;
      map[dateStr].netPnl += t.netPnl;
      if (t.netPnl > 0) map[dateStr].wins += 1;
    });
    return map;
  }, [trades]);

  // Generate calendar grid for past 10-12 weeks (matching Screenshot 3 & 5)
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    // Start 10 weeks ago from previous Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (10 * 7 + today.getDay()));

    const weeksList: Array<Array<{ date: Date; dateStr: string; tradeCount: number; netPnl: number; winRate: number }>> = [];
    const monthsMap: { [monthName: string]: number } = {};

    let current = new Date(startDate);
    let weekIndex = 0;

    while (current <= today || weeksList.length < 11) {
      const week: Array<{ date: Date; dateStr: string; tradeCount: number; netPnl: number; winRate: number }> = [];
      
      for (let day = 0; day < 7; day++) {
        const dStr = current.toISOString().split('T')[0];
        const monthName = current.toLocaleDateString('en-US', { month: 'short' });
        
        if (day === 0 && !monthsMap[monthName]) {
          monthsMap[monthName] = weekIndex;
        }

        const data = tradeMap[dStr];
        const count = data ? data.count : 0;
        const pnl = data ? data.netPnl : 0;
        const winRate = count > 0 ? (data.wins / count) * 100 : 0;

        week.push({
          date: new Date(current),
          dateStr: dStr,
          tradeCount: count,
          netPnl: pnl,
          winRate,
        });

        current.setDate(current.getDate() + 1);
      }

      weeksList.push(week);
      weekIndex++;
      if (weeksList.length >= 11) break;
    }

    return {
      weeks: weeksList,
      monthLabels: Object.entries(monthsMap).map(([name, idx]) => ({ name, colIndex: idx })),
    };
  }, [tradeMap]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Intensity color mapper
  const getCellColor = (count: number, pnl: number) => {
    if (count === 0) {
      return isLight ? 'bg-[#F1F5F9] border border-[#E5E7EB]' : 'bg-[#111722] border border-[#20283A]';
    }
    if (count === 1) {
      return isLight ? 'bg-[rgba(37,99,255,0.20)] border border-[rgba(37,99,255,0.30)]' : 'bg-[rgba(37,99,255,0.25)] border border-[rgba(37,99,255,0.35)]';
    }
    if (count === 2) {
      return isLight ? 'bg-[rgba(37,99,255,0.40)] border border-[rgba(37,99,255,0.50)]' : 'bg-[rgba(37,99,255,0.45)] border border-[rgba(37,99,255,0.55)]';
    }
    if (count <= 4) {
      return isLight ? 'bg-[rgba(37,99,255,0.70)] border border-[rgba(37,99,255,0.80)]' : 'bg-[rgba(37,99,255,0.70)] border border-[rgba(37,99,255,0.80)]';
    }
    return 'bg-[#2563FF] border border-[#3B75FF]';
  };

  const todayScore = completedItems.length;

  return (
    <div className="flex flex-col justify-between w-full h-full pt-1 pb-1 select-none">
      {/* Heatmap Area */}
      <div className="relative">
        {/* Month Headers */}
        <div className={`flex text-[10px] font-mono pl-7 mb-1.5 justify-between pr-2 ${
          isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
        }`}>
          {monthLabels.map(m => (
            <span key={m.name}>{m.name}</span>
          ))}
        </div>

        {/* Heatmap Grid (Sun-Sat rows x Week columns) */}
        <div className="flex gap-1.5 items-start">
          {/* Day of Week Labels */}
          <div className={`flex flex-col gap-1 text-[9px] font-mono pr-1 pt-0.5 select-none ${
            isLight ? 'text-[#9CA3AF]' : 'text-[#5F6B80]'
          }`}>
            {daysOfWeek.map((d, i) => (
              <span key={d} className="h-3.5 leading-none flex items-center">
                {i % 2 === 0 ? d : ''}
              </span>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="flex-1 flex gap-1 justify-between">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={() =>
                      setHoveredCell({
                        dateStr: day.date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                        tradeCount: day.tradeCount,
                        netPnl: day.netPnl,
                        winRate: day.winRate,
                      })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${getCellColor(
                      day.tradeCount,
                      day.netPnl
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Legend (Less -> More) */}
        <div className={`flex items-center justify-end gap-1.5 mt-2.5 text-[9px] font-mono ${
          isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
        }`}>
          <span>Less</span>
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[#F1F5F9] border border-[#E5E7EB]' : 'bg-[#111722] border border-[#20283A]'}`} />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[rgba(37,99,255,0.20)] border border-[rgba(37,99,255,0.30)]' : 'bg-[rgba(37,99,255,0.25)] border border-[rgba(37,99,255,0.35)]'}`} />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[rgba(37,99,255,0.40)] border border-[rgba(37,99,255,0.50)]' : 'bg-[rgba(37,99,255,0.45)] border border-[rgba(37,99,255,0.55)]'}`} />
          <div className={`w-2.5 h-2.5 rounded-[2px] ${isLight ? 'bg-[rgba(37,99,255,0.70)] border border-[rgba(37,99,255,0.80)]' : 'bg-[rgba(37,99,255,0.70)] border border-[rgba(37,99,255,0.80)]'}`} />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#2563FF] border border-[#3B75FF]" />
          <span>More</span>
        </div>

        {/* Floating Cell Tooltip */}
        {hoveredCell && (
          <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-lg text-xs shadow-2xl z-30 pointer-events-none animate-in fade-in border ${
            isLight
              ? 'bg-white border-[#E5E7EB] text-[#111827]'
              : 'bg-[#0D111B] border-[#28344A] text-[#F3F6FB]'
          }`}>
            <div className={`font-semibold ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>{hoveredCell.dateStr}</div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono">
              <span className={isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}>{hoveredCell.tradeCount} trades</span>
              <span className={isLight ? 'text-[#D1D5DB]' : 'text-[#20283A]'}>•</span>
              <span className={hoveredCell.netPnl >= 0 ? (isLight ? 'text-[#059669] font-bold' : 'text-[#00D6A3] font-bold') : (isLight ? 'text-[#DC2626] font-bold' : 'text-[#FF3D6E] font-bold')}>
                {formatCurrency(hoveredCell.netPnl)}
              </span>
              {hoveredCell.tradeCount > 0 && (
                <>
                  <span className={isLight ? 'text-[#D1D5DB]' : 'text-[#20283A]'}>•</span>
                  <span className={isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}>{hoveredCell.winRate.toFixed(0)}% Win</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Today's Score & Daily Checklist button */}
      <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-3 ${
        isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
      }`}>
        <div className="flex-1">
          <div className={`flex items-center gap-1 text-[11px] mb-1 ${
            isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
          }`}>
            <span>Today's score</span>
            <DashboardInfoTooltip
              info={{
                title: "Today's Discipline Score",
                description: 'Measures compliance with your daily trading checklist and execution rules.',
                interpretation: '5/5 score indicates 100% adherence to risk management, trade journaling, and mental discipline.',
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-sm ${
              isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
            }`}>
              {todayScore}/5
            </span>
            {/* Progress bar */}
            <div className={`h-1.5 flex-1 max-w-[130px] rounded-full overflow-hidden ${
              isLight ? 'bg-[#E5E7EB]' : 'bg-[#111722]'
            }`}>
              <div
                className="h-full bg-[#2563FF] rounded-full transition-all duration-300"
                style={{ width: `${(todayScore / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Checklist Button */}
        <button
          onClick={() => setIsChecklistOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
              : 'border-[#20283A] bg-[#0D111B] hover:bg-[#111722] hover:border-[#28344A] text-[#8C97AB] hover:text-[#F3F6FB]'
          }`}
        >
          <CalendarCheck2 className={`w-3.5 h-3.5 ${isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}`} />
          <span>Daily checklist</span>
        </button>
      </div>

      {/* Daily Checklist Modal */}
      {isChecklistOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsChecklistOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#0D111B] border-[#28344A] text-[#F3F6FB]'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isLight ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8]' : 'bg-[rgba(37,99,255,0.12)] text-[#4C7DFF]'}`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>Daily Execution Checklist</h3>
                  <p className={`text-[10px] font-mono ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>Today: {todayKey}</p>
                </div>
              </div>
              <button
                onClick={() => setIsChecklistOpen(false)}
                className={`p-1 rounded-lg transition ${
                  isLight ? 'text-[#9CA3AF] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map(item => {
                const isChecked = completedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${
                      isChecked
                        ? isLight
                          ? 'bg-[rgba(37,99,255,0.05)] border-[rgba(37,99,255,0.25)] text-[#1D4ED8]'
                          : 'bg-[rgba(37,99,255,0.08)] border-[rgba(37,99,255,0.25)] text-[#F3F6FB]'
                        : isLight
                        ? 'bg-[#F8FAFC] border-[#E5E7EB] text-[#4B5563] hover:border-[#CBD5E1]'
                        : 'bg-[#0A0E16] border-[#20283A] text-[#8C97AB] hover:border-[#28344A]'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckSquare className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}`} />
                      ) : (
                        <Square className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#9CA3AF]' : 'text-[#5F6B80]'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${
                          isChecked
                            ? isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
                            : isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
                        }`}>{item.label}</span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          isLight ? 'text-[#6B7280] bg-[#F1F5F9]' : 'text-[#8C97AB] bg-[#111722]'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress Footer */}
            <div className={`pt-3 border-t flex items-center justify-between ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <div className={`text-xs ${isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'}`}>
                Score: <strong className={`font-mono ${isLight ? 'text-[#1D4ED8] font-bold' : 'text-[#4C7DFF] font-bold'}`}>{todayScore} / 5</strong>
              </div>
              <button
                onClick={() => setIsChecklistOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#2563FF] hover:bg-[#2F6BFF] text-white text-xs font-semibold transition active:scale-[0.98]"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
