import React, { useState } from 'react';
import {
  Zap,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Shield,
  Plus,
  Play,
  Smile,
  Brain,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface DailyOperatingViewProps {
  onOpenAddHabit: () => void;
  onOpenAddTask: () => void;
  onOpenFocusTimer: () => void;
}

export const DailyOperatingView: React.FC<DailyOperatingViewProps> = ({
  onOpenAddHabit,
  onOpenAddTask,
  onOpenFocusTimer,
}) => {
  const {
    theme,
    selectedImprovementDate,
    currentGrowthScore,
    userGrowthLevel,
    disciplineStreak,
    routines,
    routineCompletions,
    toggleRoutineItem,
    tasks,
    toggleTask,
    morningCheckin,
    saveMorningCheckin,
    nightlyReview,
    saveNightlyReview,
    deepWorkSessions,
  } = useTrading();

  const isLight = theme === 'light';

  // Local state for morning checkin form
  const [morningEnergy, setMorningEnergy] = useState(morningCheckin?.energyLevel || 8);
  const [morningSleepQuality, setMorningSleepQuality] = useState(morningCheckin?.sleepQuality || 8);
  const [morningGoal, setMorningGoal] = useState(morningCheckin?.mainGoal || '');
  const [isEditingMorning, setIsEditingMorning] = useState(!morningCheckin);

  // Local state for nightly review form
  const [nightlyScore, setNightlyScore] = useState(nightlyReview?.reflectionScore || 85);
  const [nightlyWentWell, setNightlyWentWell] = useState(nightlyReview?.wentWell || '');
  const [nightlyLearned, setNightlyLearned] = useState(nightlyReview?.learned || '');
  const [isEditingNightly, setIsEditingNightly] = useState(!nightlyReview);

  // Filter tasks for current day
  const todayTasks = tasks.filter(
    (t) => t.dueDate === selectedImprovementDate || t.dueDate === new Date().toISOString().split('T')[0]
  );
  const completedTasksCount = todayTasks.filter((t) => t.status === 'Completed').length;

  const handleSaveMorning = (e: React.FormEvent) => {
    e.preventDefault();
    saveMorningCheckin({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      sleepQuality: Number(morningSleepQuality),
      energyLevel: Number(morningEnergy),
      mainGoal: morningGoal.trim() || 'Execute trading plan with zero emotional interference',
      topPriorities: [morningGoal.trim() || 'Flawless execution', 'Risk protocol 1%', '25min deep focus'],
      workoutPlanned: true,
      tradingPlanned: true,
      personalGoal: 'Remain patient during low-liquidity zones',
      avoidToday: 'Revenge trading and late night screen time',
      generatedMission: 'Maintain 100% rule compliance and execute with institutional precision.',
    });
    setIsEditingMorning(false);
  };

  const handleSaveNightly = (e: React.FormEvent) => {
    e.preventDefault();
    saveNightlyReview({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      wentWell: nightlyWentWell.trim() || 'Followed risk parameters and completed deep work session',
      wentWrong: 'Felt slight urge to overtrade in late session',
      learned: nightlyLearned.trim() || 'Stepping away from charts preserves capital and mental clarity',
      improveTomorrow: 'Prepare market levels before market open',
      followedPlan: true,
      wastedTime: false,
      maintainedDiscipline: true,
      reflectionScore: Number(nightlyScore),
    });
    setIsEditingNightly(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner: Growth Score Matrix & Daily Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Radar & Composite Score (4 Columns) */}
        <div
          className={`lg:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-zinc-200 shadow-xs'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Growth Score Index
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                currentGrowthScore.totalScore >= 85
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : currentGrowthScore.totalScore >= 70
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {currentGrowthScore.totalScore >= 85 ? 'INSTITUTIONAL' : currentGrowthScore.totalScore >= 70 ? 'ADVANCED' : 'BUILDING'}
            </span>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="text-4xl font-mono font-black tracking-tight text-blue-500">
                {currentGrowthScore.totalScore}
                <span className="text-xs text-slate-500 font-sans font-normal ml-1">/100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {currentGrowthScore.totalScore >= 85
                  ? 'Institutional Grade Performance'
                  : 'Consistent Discipline Building'}
              </p>
            </div>

            {/* Quick Circular Indicator */}
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center font-mono font-bold text-xs text-blue-400 shadow-inner">
              {Math.round(currentGrowthScore.totalScore)}%
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2 pt-3 border-t border-slate-800/40 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" /> Discipline:
              </span>
              <span className="font-mono font-semibold">{currentGrowthScore.disciplineScore}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${currentGrowthScore.disciplineScore}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" /> Daily Productivity:
              </span>
              <span className="font-mono font-semibold">{currentGrowthScore.productivityScore}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${currentGrowthScore.productivityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Morning Mission & High Priority Focus (8 Columns) */}
        <div
          className={`lg:col-span-8 p-5 rounded-2xl border flex flex-col justify-between ${
            isLight
              ? 'bg-white border-zinc-200 shadow-xs'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Morning Prime & Mind State Protocol
              </span>
            </div>
            {morningCheckin && !isEditingMorning ? (
              <button
                onClick={() => setIsEditingMorning(true)}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                Edit Check-in
              </button>
            ) : null}
          </div>

          {isEditingMorning ? (
            <form onSubmit={handleSaveMorning} className="py-3 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Sleep Quality (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={morningSleepQuality}
                    onChange={(e) => setMorningSleepQuality(parseInt(e.target.value) || 8)}
                    className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                      isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Energy Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={morningEnergy}
                    onChange={(e) => setMorningEnergy(parseInt(e.target.value) || 8)}
                    className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                      isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Prime Directive / Main Mission Today
                </label>
                <input
                  type="text"
                  placeholder="Execute cleanly on HTF setups, strictly 1% risk per trade"
                  value={morningGoal}
                  onChange={(e) => setMorningGoal(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-medium ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {morningCheckin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMorning(false)}
                    className="px-3 py-1 text-slate-400 font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow-md shadow-amber-600/20"
                >
                  Commit Morning Mindset (+50 XP)
                </button>
              </div>
            </form>
          ) : (
            <div className="py-3 flex flex-col justify-between flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Primary Intent:</span>
                  <span className="text-xs font-bold text-amber-400">
                    "{morningCheckin?.mainGoal}"
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-1.5 font-mono">
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Sleep Quality: {morningCheckin?.sleepQuality}/10</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center gap-1.5 font-mono">
                    <Smile className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Energy: {morningCheckin?.energyLevel}/10</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mindset Committed</span>
                  </div>
                </div>
              </div>

              {/* Quick deep work action banner */}
              <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="font-bold text-indigo-300 block">Deep Work Flow Session</span>
                    <span className="text-[10px] text-slate-400">
                      {deepWorkSessions.length} sessions logged today • Zero notifications mode
                    </span>
                  </div>
                </div>
                <button
                  onClick={onOpenFocusTimer}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Start Sprint</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Daily Routines Checklist & Daily Priority Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Daily Protocol Routines */}
        <div
          className={`p-5 rounded-2xl border space-y-4 ${
            isLight
              ? 'bg-white border-zinc-200 shadow-xs'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Institutional Daily Routines ({routines.length})
              </h3>
            </div>
            <button
              onClick={onOpenAddHabit}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Habit
            </button>
          </div>

          <div className="space-y-4">
            {routines.map((routine) => {
              const completedCount = routine.items.filter((item) =>
                routineCompletions.some(
                  (c) =>
                    c.routineId === routine.id &&
                    c.itemId === item.id &&
                    c.completed &&
                    c.date === selectedImprovementDate
                )
              ).length;
              const totalCount = routine.items.length;
              const isAllDone = completedCount === totalCount && totalCount > 0;

              return (
                <div
                  key={routine.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isLight
                      ? 'bg-zinc-50/80 border-zinc-200'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {routine.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({routine.category})
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isAllDone
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {completedCount}/{totalCount} Done
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {routine.items.map((item) => {
                      const isDone = routineCompletions.some(
                        (c) =>
                          c.routineId === routine.id &&
                          c.itemId === item.id &&
                          c.completed &&
                          c.date === selectedImprovementDate
                      );

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleRoutineItem(routine.id, item.id, selectedImprovementDate)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition select-none ${
                            isDone
                              ? 'bg-emerald-950/20 text-slate-400'
                              : isLight
                              ? 'hover:bg-zinc-100 text-zinc-800'
                              : 'hover:bg-slate-900 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-medium truncate ${
                                isDone ? 'line-through opacity-70' : ''
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.time && (
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">
                              {item.time}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Today's High Impact Tasks / Missions */}
        <div
          className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${
            isLight
              ? 'bg-white border-zinc-200 shadow-xs'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Daily Priority Missions ({completedTasksCount}/{todayTasks.length})
                </h3>
              </div>
              <button
                onClick={onOpenAddTask}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Mission
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  <p>No high-impact missions added for today.</p>
                  <button
                    onClick={onOpenAddTask}
                    className="mt-2 text-xs text-blue-400 font-semibold"
                  >
                    + Add your first daily priority
                  </button>
                </div>
              ) : (
                todayTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-400'
                          : isLight
                          ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-900'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-semibold block truncate ${
                              isCompleted ? 'line-through opacity-70' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                            <span
                              className={`font-mono font-bold ${
                                task.priority === 'Critical'
                                  ? 'text-rose-400'
                                  : task.priority === 'High'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-slate-500">• {task.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[10px] text-slate-400">
                        {task.estimatedDurationMins || 30} min
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Mission Add footer button */}
          <button
            onClick={onOpenAddTask}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Priority Mission (+30 XP)</span>
          </button>
        </div>
      </div>

      {/* Third Row: Nightly Reflection & Debrief Module */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Nightly Debrief & Reflection Protocol
            </h3>
          </div>
          {nightlyReview && !isEditingNightly ? (
            <button
              onClick={() => setIsEditingNightly(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Edit Reflection
            </button>
          ) : null}
        </div>

        {isEditingNightly ? (
          <form onSubmit={handleSaveNightly} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Overall Reflection Score (0-100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={nightlyScore}
                  onChange={(e) => setNightlyScore(parseInt(e.target.value) || 85)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  What went well today? (Wins)
                </label>
                <input
                  type="text"
                  placeholder="Followed risk rules, 100% habit completion, 45min deep backtest"
                  value={nightlyWentWell}
                  onChange={(e) => setNightlyWentWell(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                One Primary Lesson or Psychological Leak to Plug Tomorrow
              </label>
              <textarea
                rows={2}
                placeholder="Stayed patient during choppy London open. Need to log out immediately after hitting daily profit target."
                value={nightlyLearned}
                onChange={(e) => setNightlyLearned(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2">
              {nightlyReview && (
                <button
                  type="button"
                  onClick={() => setIsEditingNightly(false)}
                  className="px-3 py-1.5 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20"
              >
                Complete Daily Reflection (+60 XP)
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-1">Day Score:</span>
              <span className="text-2xl font-mono font-black text-indigo-400">
                {nightlyReview?.reflectionScore}/100
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 md:col-span-2">
              <span className="text-slate-400 font-bold block mb-1">Primary Lesson:</span>
              <p className="text-slate-200 leading-relaxed font-medium">
                "{nightlyReview?.learned}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
