import React, { useState } from 'react';
import {
  Award,
  Target,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface GoalsMilestonesViewProps {
  onOpenAddGoal: () => void;
}

export const GoalsMilestonesView: React.FC<GoalsMilestonesViewProps> = ({
  onOpenAddGoal,
}) => {
  const {
    theme,
    goals,
    toggleGoalMilestone,
    deleteGoal,
    achievements,
    userGrowthLevel,
    learningLogs,
    logLearning,
  } = useTrading();

  const isLight = theme === 'light';

  // Book / Learning Form
  const [bookTitle, setBookTitle] = useState('');
  const [bookCategory, setBookCategory] = useState<'Trading' | 'Psychology' | 'Business' | 'Tech' | 'Philosophy' | 'Health'>('Psychology');
  const [bookNotes, setBookNotes] = useState('');
  const [learningDuration, setLearningDuration] = useState(30);

  const handleSaveLearning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    logLearning({
      date: new Date().toISOString().split('T')[0],
      title: bookTitle.trim(),
      category: bookCategory,
      durationMins: Number(learningDuration),
      notes: bookNotes.trim(),
    });

    setBookTitle('');
    setBookNotes('');
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner: Trader Level & XP Mastery Status */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner font-mono font-black text-xl">
            L{userGrowthLevel.level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                {userGrowthLevel.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                LEVEL {userGrowthLevel.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Discipline + Trading Psychology Evolution Status
            </p>
          </div>
        </div>

        <div className="w-full md:w-72 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-semibold">
            <span className="text-slate-400">XP Progress:</span>
            <span className="text-blue-400">
              {userGrowthLevel.currentXp} / {userGrowthLevel.nextLevelXp} XP
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (userGrowthLevel.currentXp / userGrowthLevel.nextLevelXp) * 100
                )}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono block text-right">
            {userGrowthLevel.nextLevelXp - userGrowthLevel.currentXp} XP to Level {userGrowthLevel.level + 1}
          </span>
        </div>
      </div>

      {/* Strategic Milestones & Goals Grid */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Strategic Mastery Goals & Progressive Milestones ({goals.length})
            </h3>
          </div>
          <button
            onClick={onOpenAddGoal}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;
            const totalMilestones = goal.milestones.length;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isLight ? 'bg-zinc-50/80 border-zinc-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                        {goal.category} • {goal.timeframe}
                      </span>
                      <h4 className={`text-xs font-bold mt-0.5 ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                        {goal.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Milestones Done:</span>
                      <span className="font-bold text-blue-400">
                        {completedMilestones}/{totalMilestones} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="space-y-1.5 mt-3 text-xs">
                    {goal.milestones.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleGoalMilestone(goal.id, m.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none ${
                          m.completed
                            ? 'text-slate-500 line-through'
                            : isLight
                            ? 'hover:bg-zinc-100 text-zinc-800'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/40">
                  Target Deadline: {goal.deadline}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements Showcase */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Institutional Discipline Badges ({unlockedCount}/{achievements.length} Unlocked)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-between transition ${
                ach.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1.5">{ach.icon}</div>
              <span className="text-xs font-bold block">{ach.title}</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{ach.description}</p>
              <span className="text-[9px] font-mono font-bold mt-2 text-amber-500">
                +{ach.xpReward} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Learning & Book Notes Vault */}
      <div
        className={`p-5 rounded-2xl border space-y-4 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Trading Psychology & Books Vault ({learningLogs.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form to log learning */}
          <form onSubmit={handleSaveLearning} className="lg:col-span-5 space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Book or Research Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Trading in the Zone"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value as any)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-semibold ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <option value="Psychology">Psychology</option>
                  <option value="Trading">Trading</option>
                  <option value="Business">Business</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Health">Health</option>
                  <option value="Tech">Tech</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Study Duration (Min)</label>
                <input
                  type="number"
                  value={learningDuration}
                  onChange={(e) => setLearningDuration(parseInt(e.target.value) || 30)}
                  className={`w-full px-3 py-1.5 rounded-xl border font-mono ${
                    isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Key Takeaways / Principles</label>
              <textarea
                rows={3}
                placeholder="The market is a mirror of your psychological state. Every moment in the market is unique."
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20"
            >
              Save Learning Notes (+40 XP)
            </button>
          </form>

          {/* List of saved books */}
          <div className="lg:col-span-7 space-y-3">
            {learningLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-zinc-50/80 border-zinc-200' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{log.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{log.durationMins} min study • {log.category}</span>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {log.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
