import React, { useState, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Scale,
  Award,
  AlertOctagon,
  FileText,
  Sliders,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Check,
  RefreshCw,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Zap,
  Globe,
  Lock,
  Wallet
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  PropFirmAccount,
  PropFirmRule,
  PropFirmPhase,
  DrawdownModelType,
  DailyDrawdownModelType,
} from '../../types';
import { PropFirmEngine, PROP_FIRM_TEMPLATES } from '../../services/propFirmEngine';

export const PropFirmView: React.FC = () => {
  const {
    propFirmAccounts,
    selectedPropFirmAccountId,
    setSelectedPropFirmAccountId,
    addPropFirmAccount,
    updatePropFirmAccount,
    deletePropFirmAccount,
    recordPropFirmPayout,
    trades,
    addToast,
    formatCurrency,
  } = useTrading();

  // Active Tab within Prop Firm System
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'pre-trade' | 'days' | 'payouts' | 'violations'>('overview');

  // Modal States
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PropFirmRule | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Selected Account
  const activeAccount = useMemo(() => {
    return (
      propFirmAccounts.find((a) => a.id === selectedPropFirmAccountId) ||
      propFirmAccounts[0] ||
      null
    );
  }, [propFirmAccounts, selectedPropFirmAccountId]);

  // Account trades (filter if linked, else all closed trades)
  const accountTrades = useMemo(() => {
    if (!activeAccount) return [];
    if (activeAccount.tradingAccountLink && activeAccount.tradingAccountLink !== 'all') {
      return trades.filter((t) => t.accountId === activeAccount.tradingAccountLink && t.status === 'CLOSED');
    }
    return trades.filter((t) => t.status === 'CLOSED');
  }, [activeAccount, trades]);

  // Live Calculations from Engine
  const evaluation = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.evaluateAccount(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const maxDrawdownData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateMaxDrawdown(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const dailyDrawdownData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateDailyDrawdown(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const profitTargetData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateProfitTarget(activeAccount);
  }, [activeAccount]);

  const tradingDaysData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateTradingDays(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const consistencyData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateConsistency(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  // Pre-Trade Tool Inputs
  const [preTradeSymbol, setPreTradeSymbol] = useState('NQ');
  const [preTradeDirection, setPreTradeDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [preTradeQuantity, setPreTradeQuantity] = useState(2);
  const [preTradeStopLossPoints, setPreTradeStopLossPoints] = useState(15);
  const [preTradePointMultiplier, setPreTradePointMultiplier] = useState(20); // $20/pt for NQ
  const [preTradeValidation, setPreTradeValidation] = useState<any>(null);

  const handleRunPreTradeCheck = () => {
    if (!activeAccount) return;
    const estRisk = preTradeQuantity * preTradeStopLossPoints * preTradePointMultiplier;
    const result = PropFirmEngine.validatePreTrade(activeAccount, accountTrades, {
      symbol: preTradeSymbol,
      direction: preTradeDirection,
      quantity: preTradeQuantity,
      stopLossPoints: preTradeStopLossPoints,
      estimatedRiskDollar: estRisk,
    });
    setPreTradeValidation({ ...result, estRisk });
  };

  // Quick State styling helper
  const getRiskStateBadge = (state: string) => {
    switch (state) {
      case 'SAFE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SAFE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/70 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            WARNING
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/70 border border-rose-500/30 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            CRITICAL
          </span>
        );
      case 'BREACHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/90 border border-red-500/50 text-red-300">
            <AlertOctagon className="w-3.5 h-3.5" />
            RULE BREACHED
          </span>
        );
      default:
        return null;
    }
  };

  if (!activeAccount) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="p-8 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl text-center space-y-4">
          <Shield className="w-12 h-12 text-zinc-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-100">No Prop Firm Accounts Configured</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Create an evaluation account or load an institutional rule template (FTMO, Topstep, Apex, FundedNext) to begin live compliance tracking.
          </p>
          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Prop Firm Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn text-zinc-100">
      {/* Top Header & Account Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 shadow-xs shadow-blue-500/10">
              <Shield className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Prop Firm Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  Data-Driven Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time multi-firm compliance monitor, rule health center & configurable risk state engine.
              </p>
            </div>
          </div>
        </div>

        {/* Account Selector Pills & New Account Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
            {propFirmAccounts.map((acc) => {
              const isSelected = acc.id === activeAccount.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedPropFirmAccountId(acc.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600/20 text-white shadow-md border border-blue-500/40 text-blue-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{acc.name}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shadow-xs ${
                      acc.riskState === 'SAFE'
                        ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                        : acc.riskState === 'WARNING'
                        ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                        : acc.riskState === 'CRITICAL'
                        ? 'bg-rose-400 shadow-[0_0_8px_#F43F5E]'
                        : 'bg-red-500 shadow-[0_0_8px_#EF4444]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Live Risk State & Contextual Intelligence Banner */}
      <div
        className={`p-5 sm:p-6 rounded-2xl md:rounded-3xl border transition backdrop-blur-2xl ${
          evaluation?.riskState === 'SAFE'
            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_10px_30px_rgba(16,185,129,0.08)]'
            : evaluation?.riskState === 'WARNING'
            ? 'bg-amber-950/20 border-amber-500/35 shadow-[0_10px_30px_rgba(245,158,11,0.1)]'
            : evaluation?.riskState === 'CRITICAL'
            ? 'bg-rose-950/25 border-rose-500/45 shadow-[0_12px_35px_rgba(244,63,94,0.15)]'
            : 'bg-red-950/30 border-red-500/50 shadow-[0_15px_40px_rgba(239,68,68,0.2)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 shrink-0 shadow-inner">
              {evaluation?.riskState === 'SAFE' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : evaluation?.riskState === 'WARNING' ? (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              ) : (
                <AlertOctagon className="w-6 h-6 text-rose-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                {getRiskStateBadge(evaluation?.riskState || 'SAFE')}
                <span className="text-xs sm:text-sm font-bold text-slate-200">
                  {activeAccount.firmName} • {activeAccount.phaseName || activeAccount.phase}
                </span>
                <span className="text-xs text-slate-500">({activeAccount.sessionTimezone})</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white mt-1">
                {evaluation?.statusMessage}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">
                {evaluation?.actionableAdvice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            <button
              onClick={() => setActiveTab('pre-trade')}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-200 border border-white/15 transition flex items-center gap-2 shadow-xs"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Pre-Trade Check</span>
            </button>
            <button
              onClick={() => setIsEditAccountModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-200 border border-white/15 transition flex items-center gap-2 shadow-xs"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Configure Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Hero Metric Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Account Balance & Equity */}
        <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl glass-card backdrop-blur-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Account Balance</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] text-slate-300 font-mono text-[11px] border border-white/10">
              Start: {formatCurrency(activeAccount.startingBalance)}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              {formatCurrency(activeAccount.currentBalance)}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`font-bold flex items-center ${
                  activeAccount.currentBalance >= activeAccount.startingBalance
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {activeAccount.currentBalance >= activeAccount.startingBalance ? (
                  <ArrowUpRight className="w-4 h-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-0.5" />
                )}
                {formatCurrency(activeAccount.currentBalance - activeAccount.startingBalance)} (
                {(((activeAccount.currentBalance - activeAccount.startingBalance) / activeAccount.startingBalance) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>High-Water Mark</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatCurrency(maxDrawdownData?.peakEquity || activeAccount.startingBalance)}
            </span>
          </div>
        </div>

        {/* Card 2: Profit Target & Progress */}
        <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl glass-card backdrop-blur-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Profit Target</span>
            <span
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                profitTargetData?.isPassed
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-white/[0.05] border-white/10 text-slate-300'
              }`}
            >
              {profitTargetData?.isPassed ? 'PASSED' : `${(profitTargetData?.progressPercent ?? 0).toFixed(0)}% DONE`}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono flex items-baseline justify-between">
              <span>{formatCurrency(profitTargetData?.currentProfit || 0)}</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                / {formatCurrency(profitTargetData?.target || 0)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_#10B981]"
                style={{ width: `${Math.min(100, profitTargetData?.progressPercent || 0)}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remaining to Target</span>
            <span className="font-mono text-emerald-400 font-bold">
              {profitTargetData?.isPassed ? 'Goal Met!' : formatCurrency(profitTargetData?.remainingProfit || 0)}
            </span>
          </div>
        </div>

        {/* Card 3: Daily Drawdown & Buffer */}
        <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl glass-card backdrop-blur-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Daily Loss Limit</span>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] text-slate-300 font-mono text-[11px] border border-white/10">
              Max: {formatCurrency(dailyDrawdownData?.dailyLimit || 0)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono flex items-baseline justify-between">
              <span className={dailyDrawdownData?.todayLoss ? 'text-rose-400' : 'text-slate-100'}>
                {formatCurrency(dailyDrawdownData?.todayLoss || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500">today's loss</span>
            </div>
            {/* Daily Buffer Bar */}
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyDrawdownData && dailyDrawdownData.remainingDailyBufferPercent < 30
                    ? 'bg-rose-500 shadow-[0_0_10px_#F43F5E]'
                    : dailyDrawdownData && dailyDrawdownData.remainingDailyBufferPercent < 60
                    ? 'bg-amber-500 shadow-[0_0_10px_#F59E0B]'
                    : 'bg-blue-500 shadow-[0_0_10px_#3B82F6]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (dailyDrawdownData?.remainingDailyBufferPercent || 0)))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Daily Buffer</span>
            <span
              className={`font-mono font-bold ${
                dailyDrawdownData && dailyDrawdownData.remainingDailyBuffer <= 200
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {formatCurrency(dailyDrawdownData?.remainingDailyBuffer || 0)} ({(dailyDrawdownData?.remainingDailyBufferPercent ?? 0).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Card 4: Maximum Drawdown & Buffer */}
        <div className="p-5 sm:p-6 rounded-2xl md:rounded-3xl glass-card backdrop-blur-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Max Drawdown</span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/30">
              {activeAccount.drawdownModel.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono flex items-baseline justify-between">
              <span className={maxDrawdownData?.currentDrawdown ? 'text-amber-400' : 'text-slate-100'}>
                {formatCurrency(maxDrawdownData?.currentDrawdown || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                / {formatCurrency(activeAccount.rules.find((r) => r.type === 'MAX_DRAWDOWN')?.threshold || 10000)}
              </span>
            </div>
            {/* Drawdown Buffer Bar */}
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  maxDrawdownData && maxDrawdownData.bufferPercent < 30
                    ? 'bg-rose-500 shadow-[0_0_10px_#F43F5E]'
                    : maxDrawdownData && maxDrawdownData.bufferPercent < 60
                    ? 'bg-amber-500 shadow-[0_0_10px_#F59E0B]'
                    : 'bg-emerald-500 shadow-[0_0_10px_#10B981]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (maxDrawdownData?.bufferPercent || 0)))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Buffer</span>
            <span
              className={`font-mono font-bold ${
                maxDrawdownData && maxDrawdownData.bufferRemaining <= 500
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {formatCurrency(maxDrawdownData?.bufferRemaining || 0)} ({(maxDrawdownData?.bufferPercent ?? 0).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Rule Health Center</span>
        </button>

        <button
          onClick={() => setActiveTab('pre-trade')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'pre-trade'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Pre-Trade Compliance Check</span>
        </button>

        <button
          onClick={() => setActiveTab('days')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'days'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Trading Days ({tradingDaysData?.daysCompleted || 0}/{tradingDaysData?.minDaysRequired || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rule Configuration & Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payouts & Profit Split</span>
        </button>

        <button
          onClick={() => setActiveTab('violations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'violations'
              ? 'bg-zinc-800/90 text-white border-zinc-700/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Violations & Warnings ({activeAccount.violations.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: Rule Health Center Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl md:rounded-3xl glass-card backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-6 bg-white/[0.03] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Active Rule Health & Compliance Matrix</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Live status, threshold boundaries and calculation transparent formulas.
                </p>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-bold transition border border-white/15 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Rule</span>
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {evaluation?.evaluatedRules.map((rule) => {
                const isSafe = rule.status === 'SAFE' || rule.status === 'COMPLETED';
                const isWarn = rule.status === 'WARNING';
                const isCrit = rule.status === 'CRITICAL';
                const isBreach = rule.status === 'BREACHED';

                return (
                  <div
                    key={rule.id}
                    className="p-5 sm:p-6 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm sm:text-base font-bold text-white">{rule.name}</span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-white/[0.06] border border-white/10 text-slate-300">
                          {rule.type}
                        </span>
                        {!rule.enabled && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] bg-zinc-800 text-zinc-500 font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{rule.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span>Methodology: <code className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px] font-mono">{rule.calculationMethodology}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 self-end md:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-slate-100">
                          {rule.details || `Threshold: ${rule.threshold} ${rule.unit}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          Limit: {rule.threshold} {rule.unit}
                        </div>
                      </div>

                      <div className="min-w-[110px] flex justify-end">
                        {isBreach ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 border border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                            BREACHED
                          </span>
                        ) : isCrit ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                            CRITICAL
                          </span>
                        ) : isWarn ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                            WARNING
                          </span>
                        ) : rule.status === 'COMPLETED' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                            <Check className="w-3.5 h-3.5" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                            SAFE
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsAddRuleModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Pre-Trade Compliance Checker */}
      {activeTab === 'pre-trade' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Pre-Trade Order Simulator</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Simulate proposed position parameters against live prop firm limits before opening trades.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Symbol / Asset</label>
                <input
                  type="text"
                  value={preTradeSymbol}
                  onChange={(e) => setPreTradeSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. NQ, ES, EURUSD"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Direction</label>
                  <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setPreTradeDirection('BUY')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${
                        preTradeDirection === 'BUY'
                          ? 'bg-emerald-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setPreTradeDirection('SELL')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition ${
                        preTradeDirection === 'SELL'
                          ? 'bg-rose-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Quantity / Size</label>
                  <input
                    type="number"
                    min="1"
                    value={preTradeQuantity}
                    onChange={(e) => setPreTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Stop Loss (Points/Pips)</label>
                  <input
                    type="number"
                    min="1"
                    value={preTradeStopLossPoints}
                    onChange={(e) => setPreTradeStopLossPoints(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Point Multiplier ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={preTradePointMultiplier}
                    onChange={(e) => setPreTradePointMultiplier(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Total Dollar Risk:</span>
                <span className="text-rose-400 font-bold">
                  {formatCurrency(preTradeQuantity * preTradeStopLossPoints * preTradePointMultiplier)}
                </span>
              </div>

              <button
                onClick={handleRunPreTradeCheck}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <Shield className="w-4 h-4" />
                <span>Evaluate Prop Firm Rules</span>
              </button>
            </div>
          </div>

          {/* Validation Result Box */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              <span>Compliance Evaluation Result</span>
            </h3>

            {preTradeValidation ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    preTradeValidation.status === 'APPROVED'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : preTradeValidation.status === 'WARNING'
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {preTradeValidation.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : preTradeValidation.status === 'WARNING' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                    <div>
                      <div className="text-base font-black tracking-wider">
                        TRADE {preTradeValidation.status}
                      </div>
                      <p className="text-xs opacity-90">{preTradeValidation.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Rule-by-Rule Check
                  </span>
                  <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
                    {preTradeValidation.checks.map((c: any, i: number) => (
                      <div key={i} className="p-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-zinc-200">{c.ruleName}</div>
                          <div className="text-zinc-400 text-[11px]">{c.message}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'PASS'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'WARN'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 space-y-2">
                <Info className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Configure your simulated trade parameters and click "Evaluate Prop Firm Rules" to check against real risk constraints.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Trading Days & Consistency */}
      {activeTab === 'days' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trading Days Tracker */}
          <div className="p-6 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Trading Day Tracking</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950/60 border border-purple-500/30 text-purple-300">
                {tradingDaysData?.daysCompleted} / {tradingDaysData?.minDaysRequired} Days
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Only distinct session calendar dates with verified executions count toward minimum trading day requirements.
            </p>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Requirement Status:</span>
                <span className={tradingDaysData?.isSatisfied ? 'text-emerald-400' : 'text-amber-400'}>
                  {tradingDaysData?.isSatisfied ? 'Minimum Days Satisfied' : `${tradingDaysData?.daysRemaining} more days needed`}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((tradingDaysData?.daysCompleted || 0) / (tradingDaysData?.minDaysRequired || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Trading Dates</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {tradingDaysData?.tradingDates.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-200">{d}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Valid Trading Day
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consistency Rule Engine */}
          <div className="p-6 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                <span>Consistency Rule Breakdown</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  consistencyData?.isCompliant
                    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                }`}
              >
                {consistencyData?.consistencyPercent}% / {consistencyData?.allowedPercent}% Limit
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Formula: <code>(Highest Single Day Profit / Total Realized Profit) × 100</code>
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Best Single Day Profit</span>
                <span className="text-lg font-bold font-mono text-zinc-100">
                  {formatCurrency(consistencyData?.bestDayProfit || 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Positive Profit</span>
                <span className="text-lg font-bold font-mono text-zinc-100">
                  {formatCurrency(consistencyData?.totalProfit || 0)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Profit Concentration:</span>
                <span className={consistencyData?.isCompliant ? 'text-emerald-400' : 'text-amber-400'}>
                  {consistencyData?.consistencyPercent}% ({consistencyData?.marginRemaining}% safety margin)
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (consistencyData?.consistencyPercent || 0) > (consistencyData?.allowedPercent || 50)
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, consistencyData?.consistencyPercent || 0)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Rule Configuration & Engine */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Configurable Prop Firm Architecture</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rules and drawdown methodologies are fully data-driven. Adjust thresholds or add custom firm constraints.
                </p>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {activeAccount.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{rule.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400">
                          {rule.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const updated = activeAccount.rules.map((r) =>
                            r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                          );
                          updatePropFirmAccount({ ...activeAccount, rules: updated });
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          rule.enabled
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {rule.enabled ? 'Active' : 'Muted'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setIsAddRuleModalOpen(true);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Threshold:</span>
                    <span className="font-mono text-zinc-200 font-bold">
                      {rule.threshold} {rule.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: Payouts & Profit Split */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Eligible Profit</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(activeAccount.payoutInfo?.eligibleProfit || 0)}
              </div>
              <span className="text-xs text-zinc-400">
                Profit Split: {activeAccount.payoutInfo?.profitSplitPercent || 80}% to trader
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Estimated Trader Payout</span>
              <div className="text-2xl font-black font-mono text-white">
                {formatCurrency(
                  ((activeAccount.payoutInfo?.eligibleProfit || 0) *
                    (activeAccount.payoutInfo?.profitSplitPercent || 80)) /
                    100
                )}
              </div>
              <span className="text-xs text-zinc-400">Direct wire / crypto / ACH</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Payout Action</span>
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Request Payout</span>
              </button>
            </div>
          </div>

          {/* Payout History */}
          <div className="rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl overflow-hidden">
            <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 text-xs font-bold text-zinc-300">
              Payout Transaction History
            </div>
            {activeAccount.payoutInfo?.payoutHistory && activeAccount.payoutInfo.payoutHistory.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {activeAccount.payoutInfo.payoutHistory.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-zinc-200">{formatCurrency(p.amount)}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">Ref: {p.transactionRef || 'N/A'} • {p.date}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                No past payout transactions recorded on this account yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: Violations & Risk Logs */}
      {activeTab === 'violations' && (
        <div className="rounded-2xl bg-[#090A0F]/80 border border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Historical Rule Violations & Breach Audit Log</span>
            </h3>
          </div>

          {activeAccount.violations.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {activeAccount.violations.map((v) => (
                <div key={v.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400">{v.ruleName}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{new Date(v.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-zinc-300">{v.explanation}</p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                    <span>Actual: <strong className="text-rose-400">{v.actualValue}</strong></span>
                    <span>Allowed: <strong className="text-zinc-300">{v.allowedValue}</strong></span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-500/30">{v.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-emerald-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
              <p className="font-bold">Zero Violations Recorded</p>
              <p className="text-zinc-500">Account has maintained 100% compliance across all active rules.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Add New Account / Choose Starter Template */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090A0F] border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Create Prop Firm Account</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Select a popular institutional template or build a custom rule set.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-zinc-300 block">Starter Templates</label>
              <div className="space-y-2">
                {PROP_FIRM_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      addPropFirmAccount({
                        name: tmpl.name,
                        firmName: tmpl.firmName,
                        startingBalance: tmpl.startingBalance,
                        currentBalance: tmpl.startingBalance,
                        equity: tmpl.startingBalance,
                        phase: tmpl.phase,
                        status: 'ACTIVE',
                        riskState: 'SAFE',
                        drawdownModel: tmpl.drawdownModel,
                        dailyDrawdownModel: tmpl.dailyDrawdownModel,
                        sessionTimezone: tmpl.sessionTimezone,
                        currency: 'USD',
                        rules: tmpl.rules.map((r, idx) => ({ ...r, id: `r-${Date.now()}-${idx}` })),
                        violations: [],
                        payoutInfo: {
                          minTradingDaysRequired: 5,
                          tradingDaysCompleted: 0,
                          profitSplitPercent: 80,
                          eligibleProfit: 0,
                          payoutAmount: 0,
                          payoutHistory: [],
                        },
                      });
                      setIsAddAccountModalOpen(false);
                      addToast('Account Created', `Loaded ${tmpl.name} with data-driven rules`, 'success');
                    }}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-900 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{tmpl.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Balance: ${tmpl.startingBalance.toLocaleString()} • {tmpl.drawdownModel} Drawdown • {tmpl.rules.length} Rules
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
