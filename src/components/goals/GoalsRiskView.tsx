import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Lock,
  Save,
  BarChart3,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Check,
  ShieldCheck,
  Ban,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { fetchRiskGoalsApi, saveRiskGoalsApi } from '../../services/apiClient';
import { RiskGoalSettings } from '../../types';

function getStartAndEndOfWeek(dateInput: Date = new Date()) {
  const d = new Date(dateInput);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function getLocalDayString(dateInput?: string | Date) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return String(dateInput).split('T')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const GoalsRiskView: React.FC = () => {
  const {
    trades,
    accounts,
    selectedAccountId,
    riskGoals,
    updateRiskGoals,
    formatCurrency,
    addToast,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  // Selected account detail
  const selectedAccountName = useMemo(() => {
    if (selectedAccountId === 'all') return 'All Accounts (Aggregated)';
    const acc = accounts.find((a) => a.id === selectedAccountId);
    return acc ? `${acc.name} (${acc.broker || acc.type})` : 'Selected Account';
  }, [accounts, selectedAccountId]);

  // Local Form State
  const [dailyMaxLoss, setDailyMaxLoss] = useState<number>(riskGoals.dailyMaxLoss || 0);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(riskGoals.maxDrawdown || 0);
  const [weeklyProfitTarget, setWeeklyProfitTarget] = useState<number>(riskGoals.weeklyProfitTarget || 0);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState<number>(riskGoals.maxTradesPerDay || 0);
  const [maxContractsPerTrade, setMaxContractsPerTrade] = useState<number>(riskGoals.maxContractsPerTrade || 0);
  const [maxRiskPerTradeAmount, setMaxRiskPerTradeAmount] = useState<number>(riskGoals.maxRiskPerTradeAmount || 0);
  const [maxRiskPerTradePercent, setMaxRiskPerTradePercent] = useState<number>(riskGoals.maxRiskPerTradePercent || 0);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState<number>(riskGoals.maxConsecutiveLosses || 0);
  const [maxDailyLossStreak, setMaxDailyLossStreak] = useState<number>(riskGoals.maxDailyLossStreak || 0);
  const [minRMultiple, setMinRMultiple] = useState<number>(riskGoals.minRMultiple || 0);
  const [maxPositionSize, setMaxPositionSize] = useState<number>(riskGoals.maxPositionSize || 0);
  const [maxOpenPositions, setMaxOpenPositions] = useState<number>(riskGoals.maxOpenPositions || 0);
  const [enforceCircuitBreaker, setEnforceCircuitBreaker] = useState<boolean>(!!riskGoals.enforceCircuitBreaker);
  const [circuitBreakerTriggered, setCircuitBreakerTriggered] = useState<boolean>(!!riskGoals.circuitBreakerTriggered);
  const [circuitBreakerState, setCircuitBreakerState] = useState<'DISARMED' | 'ARMED' | 'WARNING' | 'TRIGGERED'>(
    riskGoals.circuitBreakerState || 'DISARMED'
  );

  const [isSaving, setIsSaving] = useState(false);

  // Sync state when riskGoals or selectedAccountId changes
  useEffect(() => {
    let isSubscribed = true;
    async function loadAccountRiskGoals() {
      try {
        const fetched = await fetchRiskGoalsApi(selectedAccountId);
        const goalsToUse = fetched || riskGoals;

        if (isSubscribed) {
          setDailyMaxLoss(goalsToUse.dailyMaxLoss || goalsToUse.maxDailyLoss || 0);
          setMaxDrawdown(goalsToUse.maxDrawdown || goalsToUse.maxDrawdownLimit || 0);
          setWeeklyProfitTarget(goalsToUse.weeklyProfitTarget || 0);
          setMaxTradesPerDay(goalsToUse.maxTradesPerDay || 0);
          setMaxContractsPerTrade(goalsToUse.maxContractsPerTrade || 0);
          setMaxRiskPerTradeAmount(goalsToUse.maxRiskPerTradeAmount || 0);
          setMaxRiskPerTradePercent(goalsToUse.maxRiskPerTradePercent || 0);
          setMaxConsecutiveLosses(goalsToUse.maxConsecutiveLosses || 0);
          setMaxDailyLossStreak(goalsToUse.maxDailyLossStreak || 0);
          setMinRMultiple(goalsToUse.minRMultiple || 0);
          setMaxPositionSize(goalsToUse.maxPositionSize || 0);
          setMaxOpenPositions(goalsToUse.maxOpenPositions || 0);
          setEnforceCircuitBreaker(!!goalsToUse.enforceCircuitBreaker);
          setCircuitBreakerTriggered(!!goalsToUse.circuitBreakerTriggered);
          setCircuitBreakerState(goalsToUse.circuitBreakerState || 'DISARMED');
        }
      } catch (e) {
        console.warn('Error loading account risk goals:', e);
      }
    }
    loadAccountRiskGoals();
    return () => {
      isSubscribed = false;
    };
  }, [selectedAccountId, riskGoals]);

  // Account Trades Filtering (Source of Truth)
  const accountTrades = useMemo(() => {
    if (!Array.isArray(trades)) return [];
    if (selectedAccountId === 'all') return trades;
    return trades.filter((t) => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  // Today's Date & Realized P&L Calculation
  const todayStr = useMemo(() => getLocalDayString(new Date()), []);

  const todayTrades = useMemo(() => {
    return accountTrades.filter((t) => {
      const entryStr = getLocalDayString(t.entryDate);
      const exitStr = getLocalDayString(t.exitDate);
      return entryStr === todayStr || exitStr === todayStr;
    });
  }, [accountTrades, todayStr]);

  const todayClosedTrades = useMemo(() => {
    return todayTrades.filter((t) => t.status === 'CLOSED');
  }, [todayTrades]);

  const todayNetPnl = useMemo(() => {
    return todayClosedTrades.reduce((acc, t) => acc + (Number(t.netPnl) || 0), 0);
  }, [todayClosedTrades]);

  const todayLossAbs = todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0;
  const todayProfitAbs = todayNetPnl > 0 ? todayNetPnl : 0;

  // Weekly Date & Realized P&L Calculation
  const { monday, sunday } = useMemo(() => getStartAndEndOfWeek(new Date()), []);

  const weekClosedTrades = useMemo(() => {
    return accountTrades.filter((t) => {
      if (t.status !== 'CLOSED') return false;
      const dateStr = t.exitDate || t.entryDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= monday && d <= sunday;
    });
  }, [accountTrades, monday, sunday]);

  const weekNetPnl = useMemo(() => {
    return weekClosedTrades.reduce((acc, t) => acc + (Number(t.netPnl) || 0), 0);
  }, [weekClosedTrades]);

  // Trailing Drawdown & Equity Peak Calculation
  const currentAccount = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return accounts.find((a) => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  const drawdownData = useMemo(() => {
    const closedTrades = accountTrades.filter((t) => t.status === 'CLOSED');

    let startingBal = 0;
    if (selectedAccountId === 'all') {
      startingBal = accounts.reduce((sum, a) => sum + (Number(a.initialBalance) || 0), 0);
    } else if (currentAccount) {
      startingBal = Number(currentAccount.initialBalance) || 0;
    }

    if (startingBal <= 0) {
      return null;
    }

    const sortedTrades = [...closedTrades].sort((a, b) => {
      const timeA = new Date(a.entryDate || a.exitDate || 0).getTime();
      const timeB = new Date(b.entryDate || b.exitDate || 0).getTime();
      return timeA - timeB;
    });

    let runningEquity = startingBal;
    let peakEquity = startingBal;

    sortedTrades.forEach((t) => {
      runningEquity += Number(t.netPnl) || 0;
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
    });

    const currentEquity = runningEquity;
    const currentDrawdown = Math.max(0, peakEquity - currentEquity);

    return {
      startingBal,
      currentEquity,
      peakEquity,
      currentDrawdown,
      closedTradesCount: sortedTrades.length,
    };
  }, [accountTrades, accounts, currentAccount, selectedAccountId]);

  // Evaluate Circuit Breaker Status
  const isDailyLossBreached = dailyMaxLoss > 0 && todayLossAbs >= dailyMaxLoss;

  const effectiveCircuitBreakerStatus = useMemo(() => {
    if (circuitBreakerTriggered || isDailyLossBreached) return 'TRIGGERED';
    if (circuitBreakerState === 'ARMED') {
      if (dailyMaxLoss > 0 && todayLossAbs >= dailyMaxLoss * 0.8) return 'WARNING';
      return 'ARMED';
    }
    return circuitBreakerState || 'DISARMED';
  }, [circuitBreakerTriggered, isDailyLossBreached, circuitBreakerState, dailyMaxLoss, todayLossAbs]);

  // Toggle Circuit Breaker Arming
  const toggleArming = () => {
    let nextState: 'DISARMED' | 'ARMED' | 'WARNING' | 'TRIGGERED';
    let nextTriggered = circuitBreakerTriggered;

    if (effectiveCircuitBreakerStatus === 'TRIGGERED') {
      // Manual reset / disarm
      nextState = 'DISARMED';
      nextTriggered = false;
      addToast('Circuit Breaker Reset', 'Emergency safety lock disarmed manually.', 'info');
    } else if (effectiveCircuitBreakerStatus === 'ARMED' || effectiveCircuitBreakerStatus === 'WARNING') {
      nextState = 'DISARMED';
      nextTriggered = false;
      addToast('Circuit Breaker Disarmed', 'Protection system is now in standby mode.', 'info');
    } else {
      nextState = 'ARMED';
      nextTriggered = false;
      addToast('Circuit Breaker ARMED 🛡️', 'Automatic lock active if daily loss limit is hit.', 'success');
    }

    setCircuitBreakerState(nextState);
    setCircuitBreakerTriggered(nextTriggered);

    const updated = {
      ...riskGoals,
      circuitBreakerState: nextState,
      circuitBreakerTriggered: nextTriggered,
    };
    updateRiskGoals(updated);
    saveRiskGoalsApi(updated, selectedAccountId);
  };

  // Form Submission Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedSettings: RiskGoalSettings = {
      dailyMaxLoss,
      maxDailyLoss: dailyMaxLoss,
      maxDrawdown,
      maxDrawdownLimit: maxDrawdown,
      weeklyProfitTarget,
      maxTradesPerDay,
      maxContractsPerTrade,
      maxRiskPerTradeAmount,
      maxRiskPerTradePercent,
      maxConsecutiveLosses,
      maxDailyLossStreak,
      minRMultiple,
      maxPositionSize,
      maxOpenPositions,
      enforceCircuitBreaker,
      circuitBreakerTriggered: effectiveCircuitBreakerStatus === 'TRIGGERED',
      circuitBreakerState: effectiveCircuitBreakerStatus,
      tradingAccountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
    };

    try {
      updateRiskGoals(updatedSettings);
      await saveRiskGoalsApi(updatedSettings, selectedAccountId);
      addToast('Risk Controls Saved', `Risk parameters updated for ${selectedAccountName}`, 'success');
    } catch (err) {
      addToast('Save Failed', 'Failed to save risk parameters to database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Render Metric Performance Cards Calculations
  const dailyLossPercent = dailyMaxLoss > 0 ? Math.min(100, Math.round((todayLossAbs / dailyMaxLoss) * 100)) : null;

  const weeklyProgress =
    weeklyProfitTarget > 0
      ? Math.min(100, Math.max(0, Math.round((Math.max(0, weekNetPnl) / weeklyProfitTarget) * 100)))
      : null;

  const dailyQuotaPercent =
    maxTradesPerDay > 0 ? Math.min(100, Math.round((todayTrades.length / maxTradesPerDay) * 100)) : null;

  const drawdownPercent =
    maxDrawdown > 0 && drawdownData
      ? Math.min(100, Math.round((drawdownData.currentDrawdown / maxDrawdown) * 100))
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className={`pb-4 border-b flex flex-wrap items-center justify-between gap-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Target className="w-6 h-6 text-indigo-500" />
              Risk & Performance Control Center
            </h1>
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
              isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
            }`}>
              {selectedAccountName}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time trade risk controls, circuit breaker monitoring, and weekly performance milestones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleArming}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md border ${
              effectiveCircuitBreakerStatus === 'TRIGGERED'
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 animate-pulse'
                : effectiveCircuitBreakerStatus === 'WARNING'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : effectiveCircuitBreakerStatus === 'ARMED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : isLight
                ? 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>
              {effectiveCircuitBreakerStatus === 'TRIGGERED'
                ? 'CIRCUIT BREAKER: TRIGGERED 🚨'
                : effectiveCircuitBreakerStatus === 'WARNING'
                ? 'CIRCUIT BREAKER: WARNING ⚠️'
                : effectiveCircuitBreakerStatus === 'ARMED'
                ? 'CIRCUIT BREAKER: ARMED 🛡️'
                : 'ARM CIRCUIT BREAKER'}
            </span>
          </button>
        </div>
      </div>

      {/* Emergency Flashing Warning Banner if Circuit Breaker Triggered */}
      {effectiveCircuitBreakerStatus === 'TRIGGERED' && (
        <div className="rounded-2xl border-2 border-rose-600 bg-rose-950/60 p-4 text-rose-200 shadow-2xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                🚨 CIRCUIT BREAKER TRIGGERED — Trade Entry Locked
              </h3>
              <p className="text-xs text-rose-300 mt-0.5">
                Daily max loss limit ({formatCurrency(dailyMaxLoss)}) reached or emergency lockout activated. Manual trade creation is restricted inside TradeForge.
              </p>
            </div>
          </div>
          <button
            onClick={toggleArming}
            className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex-shrink-0 transition shadow-lg"
          >
            Reset Lockout
          </button>
        </div>
      )}

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Daily Max Loss Buffer */}
        <div className={`rounded-2xl border p-5 shadow-lg space-y-3.5 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Daily Max Loss Buffer
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              dailyLossPercent === null
                ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                : dailyLossPercent >= 100
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : dailyLossPercent >= 80
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {dailyLossPercent === null
                ? 'NOT SET'
                : dailyLossPercent >= 100
                ? 'BREACHED'
                : dailyLossPercent >= 80
                ? 'AT RISK'
                : dailyLossPercent >= 50
                ? 'WARNING'
                : 'SAFE'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-mono font-extrabold ${
                todayLossAbs > 0 ? 'text-rose-400' : todayNetPnl > 0 ? 'text-emerald-400' : isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {todayLossAbs > 0 ? `-${formatCurrency(todayLossAbs)}` : todayNetPnl > 0 ? `+${formatCurrency(todayNetPnl)}` : '$0.00'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {dailyLossPercent !== null ? `${dailyLossPercent}% Used` : '—'}
              </span>
            </div>

            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div
                style={{ width: `${dailyLossPercent ?? 0}%` }}
                className={`h-full transition-all duration-500 ${
                  (dailyLossPercent ?? 0) >= 80 ? 'bg-rose-500' : (dailyLossPercent ?? 0) >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/40">
            <div>
              <span className="text-slate-500 block">Max Limit</span>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {dailyMaxLoss > 0 ? formatCurrency(dailyMaxLoss) : 'Not Set'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Buffer Left</span>
              <span className={`font-semibold ${
                dailyMaxLoss > 0 ? (dailyMaxLoss - todayLossAbs <= 0 ? 'text-rose-400' : 'text-emerald-400') : 'text-slate-500'
              }`}>
                {dailyMaxLoss > 0 ? formatCurrency(Math.max(0, dailyMaxLoss - todayLossAbs)) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Profit Target */}
        <div className={`rounded-2xl border p-5 shadow-lg space-y-3.5 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Flame className="w-4 h-4 text-amber-500" />
              Weekly Profit Target
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              weeklyProgress === null
                ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                : weeklyProgress >= 100
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : weekNetPnl > 0
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {weeklyProgress === null
                ? 'NOT SET'
                : weeklyProgress >= 100
                ? 'TARGET REACHED 🎉'
                : weekNetPnl > 0
                ? 'ON TRACK'
                : 'BEHIND'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-mono font-extrabold ${
                weekNetPnl > 0 ? 'text-emerald-400' : weekNetPnl < 0 ? 'text-rose-400' : isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {weekNetPnl >= 0 ? `+${formatCurrency(weekNetPnl)}` : formatCurrency(weekNetPnl)}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {weeklyProgress !== null ? `${weeklyProgress}% Achieved` : '—'}
              </span>
            </div>

            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div
                style={{ width: `${weeklyProgress ?? 0}%` }}
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/40">
            <div>
              <span className="text-slate-500 block">Weekly Target</span>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {weeklyProfitTarget > 0 ? formatCurrency(weeklyProfitTarget) : 'Not Set'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining</span>
              <span className="font-semibold text-slate-300">
                {weeklyProfitTarget > 0 ? formatCurrency(Math.max(0, weeklyProfitTarget - weekNetPnl)) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Daily Execution Quota */}
        <div className={`rounded-2xl border p-5 shadow-lg space-y-3.5 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <Zap className="w-4 h-4 text-indigo-400" />
              Daily Execution Quota
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              dailyQuotaPercent === null
                ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                : dailyQuotaPercent >= 100
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : dailyQuotaPercent >= 80
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {dailyQuotaPercent === null
                ? 'NOT SET'
                : dailyQuotaPercent >= 100
                ? 'QUOTA REACHED'
                : dailyQuotaPercent >= 80
                ? 'WARNING'
                : 'SAFE'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-mono font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {todayTrades.length}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {maxTradesPerDay > 0 ? `/ ${maxTradesPerDay} max` : 'trades today'}
                </span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {dailyQuotaPercent !== null ? `${dailyQuotaPercent}% Used` : '—'}
              </span>
            </div>

            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div
                style={{ width: `${dailyQuotaPercent ?? 0}%` }}
                className={`h-full transition-all duration-500 ${
                  (dailyQuotaPercent ?? 0) >= 100 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/40">
            <div>
              <span className="text-slate-500 block">Executed Today</span>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {todayTrades.length} trades
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Quota Left</span>
              <span className="font-semibold text-slate-300">
                {maxTradesPerDay > 0 ? `${Math.max(0, maxTradesPerDay - todayTrades.length)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Max Trailing Drawdown Guardrail */}
        <div className={`rounded-2xl border p-5 shadow-lg space-y-3.5 transition-all ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Trailing Drawdown
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              !drawdownData
                ? isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                : drawdownPercent !== null && drawdownPercent >= 100
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : drawdownPercent !== null && drawdownPercent >= 80
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {!drawdownData
                ? 'NO BALANCE DATA'
                : drawdownPercent === null
                ? 'NOT SET'
                : drawdownPercent >= 100
                ? 'BREACHED'
                : drawdownPercent >= 80
                ? 'AT RISK'
                : 'SAFE'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-mono font-extrabold ${
                drawdownData && drawdownData.currentDrawdown > 0
                  ? 'text-rose-400'
                  : isLight ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {drawdownData ? formatCurrency(drawdownData.currentDrawdown) : 'Not enough data'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {drawdownPercent !== null ? `${drawdownPercent}% Used` : '—'}
              </span>
            </div>

            <div className={`h-2.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div
                style={{ width: `${drawdownPercent ?? 0}%` }}
                className={`h-full transition-all duration-500 ${
                  (drawdownPercent ?? 0) >= 80 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-slate-800/40">
            <div>
              <span className="text-slate-500 block">Peak Equity</span>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {drawdownData ? formatCurrency(drawdownData.peakEquity) : '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Buffer Left</span>
              <span className="font-semibold text-slate-300">
                {maxDrawdown > 0 && drawdownData
                  ? formatCurrency(Math.max(0, maxDrawdown - drawdownData.currentDrawdown))
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Risk Parameters Form */}
      <form onSubmit={handleSave} className={`rounded-2xl border p-6 shadow-xl space-y-6 ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              <Sliders className="w-4 h-4 text-indigo-400" />
              Configure Risk Parameters & Guardrails
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Settings apply to {selectedAccountName}. Rules will validate pre-trade entry in TradeForge.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Parameters'}</span>
          </button>
        </div>

        {/* Section 1: Capital Protection & Targets */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Capital Protection & Profit Targets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Daily Max Loss Limit ($)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={dailyMaxLoss || ''}
                placeholder="e.g. 1000"
                onChange={(e) => setDailyMaxLoss(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Hard dollar stop loss cap per trading day</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Trailing Drawdown ($)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={maxDrawdown || ''}
                placeholder="e.g. 2500"
                onChange={(e) => setMaxDrawdown(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Maximum allowed drawdown from peak equity</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Weekly Profit Target ($)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={weeklyProfitTarget || ''}
                placeholder="e.g. 2500"
                onChange={(e) => setWeeklyProfitTarget(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Net realized target for current calendar week</span>
            </div>
          </div>
        </div>

        {/* Section 2: Trade Sizing & Position Limits */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4" /> Position Sizing & Execution Quotas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Daily Trades Quota</label>
              <input
                type="number"
                min="0"
                step="1"
                value={maxTradesPerDay || ''}
                placeholder="e.g. 5"
                onChange={(e) => setMaxTradesPerDay(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Prevents overtrading</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Contracts / Lots Per Trade</label>
              <input
                type="number"
                min="0"
                step="1"
                value={maxContractsPerTrade || ''}
                placeholder="e.g. 5"
                onChange={(e) => setMaxContractsPerTrade(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Position size cap</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Risk Per Trade ($)</label>
              <input
                type="number"
                min="0"
                step="25"
                value={maxRiskPerTradeAmount || ''}
                placeholder="e.g. 250"
                onChange={(e) => setMaxRiskPerTradeAmount(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Dollar stop loss amount</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Risk Per Trade (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={maxRiskPerTradePercent || ''}
                placeholder="e.g. 2"
                onChange={(e) => setMaxRiskPerTradePercent(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">% of account balance</span>
            </div>
          </div>
        </div>

        {/* Section 3: Advanced Discipline Guardrails & Circuit Breaker */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> Advanced Guardrails & Automated Circuit Breaker
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Consecutive Loss Streak</label>
              <input
                type="number"
                min="0"
                step="1"
                value={maxConsecutiveLosses || ''}
                placeholder="e.g. 3"
                onChange={(e) => setMaxConsecutiveLosses(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Loss limit before forced break</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Minimum Target R-Multiple</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={minRMultiple || ''}
                placeholder="e.g. 1.5"
                onChange={(e) => setMinRMultiple(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Requires minimum reward-to-risk</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Max Concurrent Open Positions</label>
              <input
                type="number"
                min="0"
                step="1"
                value={maxOpenPositions || ''}
                placeholder="e.g. 2"
                onChange={(e) => setMaxOpenPositions(Number(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Simultaneous open trades cap</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enforceCircuitBreaker}
                onChange={(e) => setEnforceCircuitBreaker(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-800"
              />
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Enforce Hard Circuit Breaker Lockout on Limit Breach
              </span>
            </label>
            <p className="text-[11px] text-slate-400 ml-7 mt-0.5">
              When enabled, hitting the Daily Max Loss or Quota automatically triggers the Circuit Breaker and restricts manual trade creation inside TradeForge.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {accountTrades.length} trade record(s) analyzed for {selectedAccountName}.
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Parameters...' : 'Save Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
