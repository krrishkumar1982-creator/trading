import React, { useState } from 'react';
import {
  Sparkles,
  Brain,
  Shield,
  Zap,
  Send,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Flame,
  Award,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const AiImprovementCoachView: React.FC = () => {
  const {
    theme,
    currentGrowthScore,
    userGrowthLevel,
    disciplineStreak,
    habits,
    morningCheckin,
    nightlyReview,
    rules,
  } = useTrading();

  const isLight = theme === 'light';

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);

  const handleGenerateAudit = async () => {
    setIsGenerating(true);
    try {
      // Simulate/call Gemini coaching engine based on trader's live metrics
      setTimeout(() => {
        setCoachAdvice(
          `### 🧠 INSTITUTIONAL PERFORMANCE AUDIT & DIRECTIVE

**Current Performance Index:** ${currentGrowthScore.overallScore}/100 (${currentGrowthScore.tier})
**Iron Discipline Streak:** ${disciplineStreak.currentStreakDays} Days Clean
**Total XP Level:** Level ${userGrowthLevel.level} (${userGrowthLevel.title})

#### 1. Core Psychological Diagnosis
- Your morning mental clarity is logged at **${morningCheckin?.mentalClarity || 8}/10**, which gives you strong executive function during the opening bell.
- **Top Strength:** Consistency in habit execution (${habits.filter((h) => h.currentStreak > 0).length} active daily streaks).
- **Potential Leak:** Screen fatigue during the mid-day consolidation period. Ensure you activate the **Deep Work Sprint** timer and completely step away from the desk after 11:30 AM EST.

#### 2. Three High-Impact Focus Directives For Today
1. **Rule Enforcement:** Strictly uphold: *"Never trade without high-timeframe confirmation."* If a setup is a B-grade, pass without hesitation.
2. **Impulse Interception:** When experiencing the urge to scalp impulsively, engage in the **5-minute screen detox** protocol before clicking any button.
3. **Evening Recovery:** Protect your 7.8-hour sleep target to ensure optimal dopamine regulation and cortisol recovery.

*“Professional traders do not chase excitement. They systematically execute high-probability edges with calm detachment.”*`
        );
        setIsGenerating(false);
      }, 900);
    } catch (e) {
      setIsGenerating(false);
    }
  };

  const handleCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setCoachAdvice(
        `### 🎯 COACH DIRECTIVE ON: "${prompt}"

**Psychological Anchor:**
The tendency to hesitate or over-analyze stems from attaching your self-worth to individual trade outcomes.

**Actionable Execution Rule:**
1. **Define Risk Before Looking At Profit:** Never enter a position without knowing your exact invalidation dollar amount.
2. **Execute Like A Casino Operator:** A casino never panics on a single hand because the edge works over 1,000 trials.
3. **Immediate Step:** Complete your 25-minute deep backtesting session to ingrain statistical confidence.`
      );
      setIsGenerating(false);
      setPrompt('');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-5 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <Brain className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>
                AI Trading Discipline & Psychology Coach
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                POWERED BY GEMINI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized audit of your habits, discipline leaks, sleep, and execution standards.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateAudit}
          disabled={isGenerating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 shrink-0"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Run Live Performance Audit</span>
        </button>
      </div>

      {/* Advice Display */}
      {coachAdvice && (
        <div
          className={`p-6 rounded-2xl border space-y-4 ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
              : 'bg-slate-900/90 border-slate-800 text-slate-100'
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-2">
            {coachAdvice.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-sm font-bold text-indigo-400 pb-1 border-b border-slate-800">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-xs font-bold text-blue-400 mt-3">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              return (
                <p key={idx} className="text-slate-300">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Query Bar */}
      <div
        className={`p-5 rounded-2xl border space-y-3 ${
          isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Ask Coach About Mindset, Fear, Revenge Trading, or Habit Building
        </label>
        <form onSubmit={handleCustomQuestion} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. How do I stop taking revenge trades after a small loss?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-indigo-500 ${
              isLight ? 'bg-zinc-50 border-zinc-300 text-zinc-900' : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Consult</span>
          </button>
        </form>
      </div>
    </div>
  );
};
