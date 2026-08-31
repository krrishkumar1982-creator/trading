import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Target,
  Shield,
  Flame,
  Brain,
  Moon,
  Dumbbell,
  BookOpen,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { DailyOperatingView } from './DailyOperatingView';
import { HabitTrackerView } from './HabitTrackerView';
import { MindWellbeingView } from './MindWellbeingView';
import { GoalsMilestonesView } from './GoalsMilestonesView';
import { AiImprovementCoachView } from './AiImprovementCoachView';
import {
  AddHabitModal,
  AddTaskModal,
  AddGoalModal,
  AddRuleModal,
  DeepWorkTimerModal,
} from './Modals';

type ImprovementTab = 'DAILY' | 'HABITS' | 'MIND_BODY' | 'GOALS' | 'AI_COACH';

export const SelfImprovementView: React.FC = () => {
  const {
    theme,
    selectedImprovementDate,
    setSelectedImprovementDate,
    currentGrowthScore,
    userGrowthLevel,
    disciplineStreak,
    habits,
    tasks,
  } = useTrading();

  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<ImprovementTab>('DAILY');

  // Modals state
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedImprovementDate || new Date().toISOString().split('T')[0]);
    d.setDate(d.getDate() - 1);
    setSelectedImprovementDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedImprovementDate || new Date().toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
    setSelectedImprovementDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedImprovementDate(new Date().toISOString().split('T')[0]);
  };

  const formattedDate = new Date(
    selectedImprovementDate || new Date().toISOString().split('T')[0]
  ).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
              Self Improvement & Discipline Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              TERMINAL OS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personal performance, cognitive optimization, habit tracking & institutional execution discipline.
          </p>
        </div>

        {/* Date Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl border ${
              isLight ? 'bg-white border-zinc-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={handlePrevDay}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono font-semibold text-blue-400 hover:text-blue-300"
            >
              {formattedDate}
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsFocusTimerOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deep Work</span>
          </button>
        </div>
      </div>

      {/* Quick Status Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Growth Score</span>
            <div className="text-base font-mono font-black text-blue-400">
              {currentGrowthScore.overallScore}%{' '}
              <span className="text-[10px] font-sans text-slate-500">({currentGrowthScore.tier})</span>
            </div>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Iron Streak</span>
            <div className="text-base font-mono font-black text-amber-400">
              {disciplineStreak.currentStreakDays} Days Clean
            </div>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Level Mastery</span>
            <div className="text-base font-mono font-black text-emerald-400">
              Level {userGrowthLevel.level} ({userGrowthLevel.currentXp} XP)
            </div>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Habits</span>
            <div className="text-base font-mono font-black text-indigo-400">
              {habits.length} Habits Tracked
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-2xl border overflow-x-auto custom-scrollbar ${
          isLight ? 'bg-zinc-100/80 border-zinc-200' : 'bg-slate-950/80 border-slate-800'
        }`}
      >
        {[
          { id: 'DAILY', label: 'Daily Operating System', icon: Sparkles },
          { id: 'HABITS', label: 'Habit & Discipline Engine', icon: Zap },
          { id: 'MIND_BODY', label: 'Mind, Sleep & Body', icon: Moon },
          { id: 'GOALS', label: 'Strategic Goals & Mastery', icon: Target },
          { id: 'AI_COACH', label: 'AI Performance Coach', icon: Brain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ImprovementTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? isLight
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'bg-slate-800 text-blue-400 shadow-sm'
                  : isLight
                  ? 'text-zinc-600 hover:text-zinc-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Content */}
      {activeTab === 'DAILY' && (
        <DailyOperatingView
          onOpenAddHabit={() => setIsAddHabitOpen(true)}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          onOpenFocusTimer={() => setIsFocusTimerOpen(true)}
        />
      )}

      {activeTab === 'HABITS' && (
        <HabitTrackerView
          onOpenAddHabit={() => setIsAddHabitOpen(true)}
          onOpenAddRule={() => setIsAddRuleOpen(true)}
        />
      )}

      {activeTab === 'MIND_BODY' && <MindWellbeingView />}

      {activeTab === 'GOALS' && (
        <GoalsMilestonesView onOpenAddGoal={() => setIsAddGoalOpen(true)} />
      )}

      {activeTab === 'AI_COACH' && <AiImprovementCoachView />}

      {/* Global Modals */}
      <AddHabitModal
        isOpen={isAddHabitOpen}
        onClose={() => setIsAddHabitOpen(false)}
      />
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
      />
      <AddRuleModal
        isOpen={isAddRuleOpen}
        onClose={() => setIsAddRuleOpen(false)}
      />
      <DeepWorkTimerModal
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
      />
    </div>
  );
};
