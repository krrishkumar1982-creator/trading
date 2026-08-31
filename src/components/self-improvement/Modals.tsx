import React, { useState } from 'react';
import {
  X,
  Zap,
  Target,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Award,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { HabitCategory, HabitFrequency, HabitDifficulty } from '../../types';

// ==========================================
// 1. ADD HABIT MODAL
// ==========================================
interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose }) => {
  const { addHabit, theme } = useTrading();
  const isLight = theme === 'light';

  const [name, setName] = useState('');
  const [target, setTarget] = useState('1 session');
  const [category, setCategory] = useState<HabitCategory>('Discipline');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>('medium');
  const [weight, setWeight] = useState(3);
  const [color, setColor] = useState('#2563FF');
  const [icon, setIcon] = useState('Zap');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      category,
      target: target.trim() || '1 completion',
      frequency,
      difficulty,
      weight: Number(weight) || 3,
      active: true,
      color,
      icon,
    });

    onClose();
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold flex items-center gap-2 text-blue-500">
            <Zap className="w-4 h-4" />
            <span>Create New Discipline Habit</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Habit Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 15min Post-Market Review, 50 Pushups, No Sugar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none focus:border-blue-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Pillar Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="Discipline">⚡ Discipline</option>
                <option value="Trading">📈 Trading</option>
                <option value="Fitness">💪 Fitness</option>
                <option value="Mind">🧠 Mind</option>
                <option value="Morning">🌅 Morning</option>
                <option value="Productivity">🎯 Productivity</option>
                <option value="Custom">✨ Custom</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Daily Target / Reps</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 20 pages, 30 min, 1 session"
                className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Discipline Weight (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 3)}
                className={`w-full px-3.5 py-2 rounded-xl border font-mono focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
            >
              Save Habit (+50 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. ADD DAILY TASK / MISSION MODAL
// ==========================================
interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask, selectedImprovementDate, theme } = useTrading();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trading');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [estimatedDurationMins, setEstimatedDurationMins] = useState(30);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDate: selectedImprovementDate || new Date().toISOString().split('T')[0],
      estimatedDurationMins: Number(estimatedDurationMins) || 30,
      status: 'Pending',
      scoreContribution: 10,
    });

    onClose();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
            <Target className="w-4 h-4" />
            <span>Add High-Impact Daily Mission</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Task / Objective Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Backtest 20 trades on NQ 15m, Deep Work Session 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none focus:border-emerald-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="Trading">📈 Trading</option>
                <option value="Productivity">⚡ Deep Work</option>
                <option value="Learning">📚 Study / Research</option>
                <option value="Fitness">💪 Fitness</option>
                <option value="Personal">🌱 Personal</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="Critical">🔴 Critical (Must Complete)</option>
                <option value="High">🟠 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">⚪ Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Estimated Focus Time (Minutes)</label>
            <input
              type="number"
              min="5"
              step="5"
              value={estimatedDurationMins}
              onChange={(e) => setEstimatedDurationMins(parseInt(e.target.value) || 30)}
              className={`w-full px-3.5 py-2 rounded-xl border font-mono focus:outline-none ${
                isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md shadow-emerald-600/20"
            >
              Add Mission (+30 XP)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. DEEP WORK FOCUS TIMER MODAL
// ==========================================
interface DeepWorkTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeepWorkTimerModal: React.FC<DeepWorkTimerModalProps> = ({ isOpen, onClose }) => {
  const { logDeepWorkSession, theme, addToast, selectedImprovementDate } = useTrading();
  const isLight = theme === 'light';

  const [sessionName, setSessionName] = useState('Deep Work Sprint');
  const [category, setCategory] = useState('Trading Study');
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [focusRating, setFocusRating] = useState(9);
  const [interruptionCount, setInterruptionCount] = useState(0);

  React.useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      addToast('Deep Work Complete!', 'Great focus session completed. Logging your progress.', 'success');
      handleSaveSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const handleSaveSession = () => {
    const totalMinutesElapsed = Math.round((25 * 60 - secondsRemaining) / 60) || 25;
    logDeepWorkSession({
      date: selectedImprovementDate || new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() - totalMinutesElapsed * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationMins: totalMinutesElapsed,
      taskName: sessionName,
      category,
      focusRating,
      distractionCount: interruptionCount,
    });
    onClose();
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(25 * 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 text-center ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Focus Protocol
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className={`w-full text-center text-sm font-bold bg-transparent border-b pb-1 focus:outline-none ${
              isLight ? 'border-zinc-300 text-zinc-900' : 'border-slate-800 text-slate-100'
            }`}
          />
        </div>

        {/* Big Digital Countdown Clock */}
        <div className="py-4">
          <div className="text-6xl font-mono font-black tracking-tight text-indigo-400 drop-shadow-md">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            25-Minute Flow State • Zero Alt-Tab or Phone Distractions
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isActive ? 'Pause Focus' : 'Start Focus Sprint'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Quality Rating */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Flow Rating:</span>
          <div className="flex items-center gap-1">
            {[2, 4, 6, 8, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFocusRating(star)}
                className={`text-sm ${star <= focusRating ? 'text-amber-400' : 'text-slate-600'}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSession}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
        >
          Save Completed Focus Session (+100 XP)
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 4. ADD PERSONAL GOAL MODAL
// ==========================================
interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose }) => {
  const { addGoal, theme } = useTrading();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Discipline' | 'Trading' | 'Fitness' | 'Mind' | 'Learning' | 'Financial'>('Trading');
  const [timeframe, setTimeframe] = useState<'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'>('MEDIUM_TERM');
  const [targetValue, setTargetValue] = useState(100);
  const [unit, setUnit] = useState('%');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      timeframe,
      targetValue: Number(targetValue) || 100,
      currentValue: 0,
      unit: unit.trim() || '%',
      deadline,
      status: 'IN_PROGRESS',
      milestones: [
        { id: `m_${Date.now()}_1`, title: 'Initial preparation and milestone 1', completed: false },
        { id: `m_${Date.now()}_2`, title: '50% progress execution checkpoint', completed: false },
        { id: `m_${Date.now()}_3`, title: 'Final mastery & review', completed: false },
      ],
    });

    onClose();
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold flex items-center gap-2 text-blue-500">
            <Award className="w-4 h-4" />
            <span>Create Strategic Growth Goal</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Goal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Pass 100k Prop Firm Funded Account with 0 Rule Breaches"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none focus:border-blue-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="Trading">📈 Trading</option>
                <option value="Discipline">⚡ Discipline</option>
                <option value="Fitness">💪 Fitness</option>
                <option value="Financial">💰 Financial</option>
                <option value="Mind">🧠 Mind</option>
                <option value="Learning">📚 Learning</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Time Horizon</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <option value="SHORT_TERM">🗓️ Short Term (30 Days)</option>
                <option value="MEDIUM_TERM">📊 Medium Term (90 Days)</option>
                <option value="LONG_TERM">🏆 Long Term (1 Year+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Numeric Value</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 100)}
                className={`w-full px-3.5 py-2 rounded-xl border font-mono focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Target Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="%, USD, trades, books, lbs"
                className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Target Completion Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border font-mono focus:outline-none ${
                isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
              }`}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20"
            >
              Create Strategic Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 5. ADD NON-NEGOTIABLE RULE MODAL
// ==========================================
interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddRuleModal: React.FC<AddRuleModalProps> = ({ isOpen, onClose }) => {
  const { addRule, theme } = useTrading();
  const isLight = theme === 'light';

  const [text, setText] = useState('');
  const [category, setCategory] = useState<'TRADING' | 'LIFESTYLE' | 'DISCIPLINE' | 'HEALTH'>('TRADING');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    addRule({
      text: text.trim(),
      category,
    });

    onClose();
    setText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
            <Shield className="w-4 h-4" />
            <span>Add Non-Negotiable Principle</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">The Rule / Non-Negotiable Contract *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Never enter a trade without an HTF key level and defined 1R stop loss."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border font-medium focus:outline-none focus:border-amber-500 ${
                isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl border font-semibold focus:outline-none ${
                isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <option value="TRADING">📈 Trading Execution</option>
              <option value="DISCIPLINE">⚡ Discipline & Impulse Control</option>
              <option value="LIFESTYLE">🌱 Lifestyle & Routine</option>
              <option value="HEALTH">💪 Physical Health & Sleep</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-md shadow-amber-600/20"
            >
              Enforce Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
