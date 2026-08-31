import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Shield,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface HabitTrackerViewProps {
  onOpenAddHabit: () => void;
  onOpenAddRule: () => void;
}

export const HabitTrackerView: React.FC<HabitTrackerViewProps> = ({
  onOpenAddHabit,
  onOpenAddRule,
}) => {
  const {
    theme,
    habits,
    habitCompletions,
    toggleHabit,
    deleteHabit,
    selectedImprovementDate,
    rules,
    toggleRuleVerification,
    deleteRule,
    disciplineStreak,
    updateDisciplineStreak,
  } = useTrading();

  const isLight = theme === 'light';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isStreakResetModalOpen, setIsStreakResetModalOpen] = useState(false);
  const [resetNote, setResetNote] = useState('');

  // Calculate past 7 days for the weekly grid
  const daysArray = React.useMemo(() => {
    const today = new Date(selectedImprovementDate || new Date().toISOString().split('T')[0]);
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const dayNumber = d.getDate();
      arr.push({ dateStr: iso, dayName, dayNumber, isToday: i === 0 });
    }
    return arr;
  }, [selectedImprovementDate]);

  const filteredHabits = habits.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    return h.category === selectedCategory;
  });

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    updateDisciplineStreak('RELAPSE', resetNote.trim() || 'Rule breach relapse');
    setIsStreakResetModalOpen(false);
    setResetNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner: Iron Discipline Streak & Relapse Shield */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 ${
          isLight
            ? 'bg-white border-zinc-200 shadow-xs'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                Iron Discipline Streak Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ACTIVE SHIELD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero rule breaks, zero impulsive trades, 100% daily standard compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-mono font-black text-amber-400">
              {disciplineStreak.currentStreakDays}{' '}
              <span className="text-xs text-slate-400 font-sans font-normal">Days Clean</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Best: {disciplineStreak.bestStreakDays} Days Clean
            </div>
          </div>

          <button
            onClick={() => setIsStreakResetModalOpen(true)}
            className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition font-semibold"
          >
            Log Relapse
          </button>
        </div>
      </div>

      {/* Habits Matrix Container */}
      <div
        className={`p-5 rounded-2xl border space-y-5 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        {/* Filter Tabs & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
            {[
              { id: 'ALL', label: 'All Habits' },
              { id: 'Discipline', label: '⚡ Discipline' },
              { id: 'Trading', label: '📈 Trading' },
              { id: 'Fitness', label: '💪 Fitness' },
              { id: 'Mind', label: '🧠 Mind' },
              { id: 'Morning', label: '🌅 Morning' },
              { id: 'Productivity', label: '🎯 Productivity' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : isLight
                    ? 'text-zinc-600 hover:bg-zinc-100'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenAddHabit}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Habit</span>
          </button>
        </div>

        {/* Habit Table / Grid */}
        <div className="space-y-3">
          {filteredHabits.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <p>No habits configured in this category.</p>
              <button
                onClick={onOpenAddHabit}
                className="mt-2 text-xs text-blue-400 font-semibold"
              >
                + Create your first habit
              </button>
            </div>
          ) : (
            filteredHabits.map((habit) => {
              const isTodayCompleted = habitCompletions.some(
                (c) =>
                  c.habitId === habit.id &&
                  c.date === selectedImprovementDate &&
                  c.completed
              );

              // Calculate streak for this habit
              const habitCompletionsCount = habitCompletions.filter(
                (c) => c.habitId === habit.id && c.completed
              ).length;

              return (
                <div
                  key={habit.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    isTodayCompleted
                      ? 'bg-emerald-950/15 border-emerald-500/25'
                      : isLight
                      ? 'bg-zinc-50/80 border-zinc-200'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  {/* Left Habit Meta Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      onClick={() => toggleHabit(habit.id, selectedImprovementDate)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition shrink-0 ${
                        isTodayCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isTodayCompleted ? <Check className="w-5 h-5" /> : <Zap className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold truncate ${
                            isLight ? 'text-zinc-900' : 'text-slate-100'
                          }`}
                        >
                          {habit.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                          {habit.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Target: {habit.target} • {habit.frequency} • Weight: {habit.weight}/5
                      </p>
                    </div>
                  </div>

                  {/* Right: 7-Day Completion Bubbles & Stats */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                    {/* Weekly 7-day checkboxes */}
                    <div className="flex items-center gap-1.5">
                      {daysArray.map((day) => {
                        const isDone = habitCompletions.some(
                          (c) => c.habitId === habit.id && c.date === day.dateStr && c.completed
                        );

                        return (
                          <div
                            key={day.dateStr}
                            onClick={() => toggleHabit(habit.id, day.dateStr)}
                            className="flex flex-col items-center gap-1 cursor-pointer group"
                            title={`${day.dateStr} - Click to toggle`}
                          >
                            <span className="text-[9px] font-mono text-slate-500">
                              {day.dayName}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition text-[10px] font-mono ${
                                isDone
                                  ? 'bg-emerald-500 text-white font-bold'
                                  : day.isToday
                                  ? 'border-2 border-blue-500 bg-blue-500/10 text-blue-400'
                                  : 'bg-slate-800 text-slate-600 group-hover:bg-slate-700'
                              }`}
                            >
                              {isDone ? '✓' : day.dayNumber}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Streak Badge */}
                    <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-amber-400 flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{habitCompletionsCount} done</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {habit.difficulty}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Non-Negotiable Rules & Trading Principles */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Non-Negotiable Trading & Life Code of Conduct ({rules.length})
            </h3>
          </div>
          <button
            onClick={onOpenAddRule}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map((rule) => {
            const isVerifiedToday = rule.verifiedDates?.includes(
              selectedImprovementDate || new Date().toISOString().split('T')[0]
            );

            return (
              <div
                key={rule.id}
                onClick={() => toggleRuleVerification(rule.id, selectedImprovementDate)}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                  isVerifiedToday
                    ? 'bg-amber-950/15 border-amber-500/30 text-slate-200'
                    : isLight
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isVerifiedToday
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isVerifiedToday ? <Check className="w-4 h-4" /> : <Shield className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-snug">{rule.text}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                      {rule.category} • Verified {rule.verifiedDates?.length || 0} times
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRule(rule.id);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Relapse Logging Modal */}
      {isStreakResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
              isLight ? 'bg-white border-zinc-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                Acknowledge Discipline Relapse
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              True mastery begins with radical honesty. Documenting what triggered the breach allows you to build psychological immune response.
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  What caused the breach? (Root cause analysis)
                </label>
                <textarea
                  required
                  rows={3}
                  value={resetNote}
                  onChange={(e) => setResetNote(e.target.value)}
                  placeholder="e.g. Took a trade out of boredom at lunch with no setup criteria, violated 1% risk."
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStreakResetModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-md shadow-rose-600/20"
                >
                  Reset Streak & Learn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
