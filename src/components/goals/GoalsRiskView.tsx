import React, { useState } from 'react';
import {
  Target,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Lock,
  Zap,
  Save
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const GoalsRiskView: React.FC = () => {
  const { riskGoals, updateRiskGoals, filteredTrades, formatCurrency, addToast } = useTrading();

  const [dailyMaxLoss, setDailyMaxLoss] = useState(riskGoals.dailyMaxLoss);
  const [maxDrawdown, setMaxDrawdown] = useState(riskGoals.maxDrawdown);
  const [weeklyProfitTarget, setWeeklyProfitTarget] = useState(riskGoals.weeklyProfitTarget);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(riskGoals.maxTradesPerDay);
  const [maxContractsPerTrade, setMaxContractsPerTrade] = useState(riskGoals.maxContractsPerTrade);
  const [circuitBreakerTriggered, setCircuitBreakerTriggered] = useState(riskGoals.circuitBreakerTriggered);

  // Compute Today's Realized Loss
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = filteredTrades.filter(t => t.entryDate && t.entryDate.startsWith(todayStr) && t.status === 'CLOSED');
  const todayNet = todayTrades.reduce((acc, t) => acc + t.netPnl, 0);
  const todayLossAbs = todayNet < 0 ? Math.abs(todayNet) : 0;
  const dailyLossPercent = dailyMaxLoss > 0 ? Math.min(100, Math.round((todayLossAbs / dailyMaxLoss) * 100)) : 0;

  // Compute Weekly Target Progress (trades in current week or latest 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentTrades = filteredTrades.filter(t => {
    if (!t.entryDate || t.status !== 'CLOSED') return false;
    const d = new Date(t.entryDate);
    return d >= sevenDaysAgo;
  });
  const weekTrades = recentTrades.length > 0 ? recentTrades : filteredTrades.filter(t => t.status === 'CLOSED');
  const weekNet = weekTrades.reduce((acc, t) => acc + t.netPnl, 0);
  const weeklyProgress = weeklyProfitTarget > 0 ? Math.min(100, Math.max(0, Math.round((Math.max(0, weekNet) / weeklyProfitTarget) * 100))) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRiskGoals({
      dailyMaxLoss,
      maxDrawdown,
      weeklyProfitTarget,
      maxTradesPerDay,
      maxContractsPerTrade,
      circuitBreakerTriggered,
    });
  };

  const toggleEmergencyLock = () => {
    const newState = !circuitBreakerTriggered;
    setCircuitBreakerTriggered(newState);
    updateRiskGoals({ circuitBreakerTriggered: newState });
    addToast(
      newState ? 'Circuit Breaker Locked 🚨' : 'Circuit Breaker Disarmed',
      newState ? 'Trading blocked on this account until next trading session' : 'Safety lock disarmed',
      newState ? 'error' : 'info'
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-400" />
            Goals, Risk Controls & Circuit Breakers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated capital preservation guardrails and profit milestone tracking
          </p>
        </div>

        <button
          onClick={toggleEmergencyLock}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
            circuitBreakerTriggered
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{circuitBreakerTriggered ? 'CIRCUIT BREAKER: LOCKED 🔒' : 'ARM CIRCUIT BREAKER'}</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Max Loss Guardrail */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Daily Max Loss Buffer
            </span>
            <span className="text-xs font-mono font-bold text-rose-400">{dailyLossPercent}% Used</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${dailyLossPercent}%` }}
              className={`h-full transition-all duration-500 ${
                dailyLossPercent > 80 ? 'bg-rose-500' : dailyLossPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>Loss Today: ${(todayLossAbs ?? 0).toFixed(2)}</span>
            <span>Max Cap: ${(dailyMaxLoss ?? 1000).toLocaleString()}</span>
          </div>
        </div>

        {/* Weekly Profit Target Milestone */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Weekly Profit Target
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">{weeklyProgress}% Achieved</span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${weeklyProgress}%` }}
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>Accumulated: ${Math.max(0, weekNet ?? 0).toFixed(2)}</span>
            <span>Target: ${(weeklyProfitTarget ?? 2500).toLocaleString()}</span>
          </div>
        </div>

        {/* Max Daily Trade Count */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-5 shadow-xl backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              Daily Execution Quota
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {todayTrades.length} / {maxTradesPerDay}
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (todayTrades.length / maxTradesPerDay) * 100)}%` }}
              className="h-full bg-indigo-500 transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>Trades Executed: {todayTrades.length}</span>
            <span>Quota Left: {Math.max(0, maxTradesPerDay - todayTrades.length)}</span>
          </div>
        </div>
      </div>

      {/* Rules Config Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-xl space-y-5">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          Configure Hard Risk Restrictions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Daily Max Loss Limit ($)</label>
            <input
              type="number"
              value={dailyMaxLoss}
              onChange={e => setDailyMaxLoss(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Trailing Drawdown ($)</label>
            <input
              type="number"
              value={maxDrawdown}
              onChange={e => setMaxDrawdown(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Weekly Profit Target ($)</label>
            <input
              type="number"
              value={weeklyProfitTarget}
              onChange={e => setWeeklyProfitTarget(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Allowed Contracts / Trade</label>
            <input
              type="number"
              value={maxContractsPerTrade}
              onChange={e => setMaxContractsPerTrade(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Max Daily Trades</label>
            <input
              type="number"
              value={maxTradesPerDay}
              onChange={e => setMaxTradesPerDay(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Risk Parameters</span>
          </button>
        </div>
      </form>
    </div>
  );
};
