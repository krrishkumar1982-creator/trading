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
  Wallet,
  Building,
  FileCode,
  CheckSquare
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  PropFirmAccount,
  PropFirmRule,
  PropFirmPhase,
  ProgramModelType,
  DrawdownModelType,
  DailyDrawdownModelType,
  PropFirmEnforcementMode,
} from '../../types';
import {
  PropFirmEngine,
  PROP_FIRM_TEMPLATES,
  LEGION_FUNDING_PRESETS,
  createAccountFromPreset,
} from '../../services/propFirmEngine';

export const PropFirmView: React.FC = () => {
  const {
    accounts,
    propFirmAccounts,
    selectedPropFirmAccountId,
    setSelectedPropFirmAccountId,
    addPropFirmAccount,
    updatePropFirmAccount,
    deletePropFirmAccount,
    recordPropFirmPayout,
    trades,
    economicEvents,
    addToast,
    formatCurrency,
  } = useTrading();

  // Active Sub-Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'rules' | 'pre-trade' | 'days' | 'exposures' | 'payouts' | 'violations'
  >('overview');

  // Modal Controls
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PropFirmRule | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Add Account Modal Form State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('legion-2step-p1-50k');
  const [selectedAccountSize, setSelectedAccountSize] = useState<number>(50000);
  const [customAccountSizeInput, setCustomAccountSizeInput] = useState<string>('');
  const [customAccountName, setCustomAccountName] = useState<string>('');
  const [selectedAccountLink, setSelectedAccountLink] = useState<string>('all');

  // Edit Account Form State
  const [editAccountName, setEditAccountName] = useState<string>('');
  const [editStartingBalance, setEditStartingBalance] = useState<number>(50000);
  const [editDailyLossPercent, setEditDailyLossPercent] = useState<number>(4);
  const [editTotalLossPercent, setEditTotalLossPercent] = useState<number>(10);
  const [editTargetPercent, setEditTargetPercent] = useState<number>(8);
  const [editEnforcementMode, setEditEnforcementMode] = useState<PropFirmEnforcementMode>('MONITOR');

  // Selected Account
  const activeAccount = useMemo(() => {
    return (
      propFirmAccounts.find((a) => a.id === selectedPropFirmAccountId) ||
      propFirmAccounts[0] ||
      null
    );
  }, [propFirmAccounts, selectedPropFirmAccountId]);

  // Closed trades linked to active account
  const accountTrades = useMemo(() => {
    if (!activeAccount) return [];
    if (activeAccount.tradingAccountLink && activeAccount.tradingAccountLink !== 'all') {
      return trades.filter(
        (t) => t.accountId === activeAccount.tradingAccountLink && t.status === 'CLOSED'
      );
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

  const symbolRiskData = useMemo(() => {
    if (!activeAccount) return [];
    return PropFirmEngine.calculateSymbolRiskExposure(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const durationData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateTradeDurations(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const inactivityData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateInactivity(activeAccount, accountTrades);
  }, [activeAccount, accountTrades]);

  const payoutData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculatePayoutEligibility(activeAccount);
  }, [activeAccount]);

  const newsData = useMemo(() => {
    if (!activeAccount) return null;
    return PropFirmEngine.calculateNewsCompliance(activeAccount, accountTrades, economicEvents || []);
  }, [activeAccount, accountTrades, economicEvents]);

  // Pre-Trade Order Simulator Inputs
  const [preTradeSymbol, setPreTradeSymbol] = useState('NQ');
  const [preTradeDirection, setPreTradeDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [preTradeQuantity, setPreTradeQuantity] = useState(2);
  const [preTradeStopLossPoints, setPreTradeStopLossPoints] = useState(15);
  const [preTradePointMultiplier, setPreTradePointMultiplier] = useState(20);
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

  // Quick State badge styling helper
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

  // Helper for preset selection in Add Modal
  const selectedPreset = useMemo(() => {
    return LEGION_FUNDING_PRESETS.find((p) => p.id === selectedPresetId) || LEGION_FUNDING_PRESETS[0];
  }, [selectedPresetId]);

  const effectiveAccountSize = useMemo(() => {
    if (customAccountSizeInput && !isNaN(parseFloat(customAccountSizeInput)) && parseFloat(customAccountSizeInput) > 0) {
      return parseFloat(customAccountSizeInput);
    }
    return selectedAccountSize;
  }, [customAccountSizeInput, selectedAccountSize]);

  // Dynamic calculations for preview card
  const calcTarget = selectedPreset.profitTargetPercent > 0 ? (effectiveAccountSize * selectedPreset.profitTargetPercent) / 100 : 0;
  const calcDailyLoss = (effectiveAccountSize * selectedPreset.dailyLossPercent) / 100;
  const calcTotalLoss = (effectiveAccountSize * selectedPreset.totalLossPercent) / 100;
  const calcMaxRiskSymbol = selectedPreset.maxRiskPerSymbolPercent ? (effectiveAccountSize * selectedPreset.maxRiskPerSymbolPercent) / 100 : null;
  const calcQualifyingDay = selectedPreset.qualifyingDayProfitPercent ? (effectiveAccountSize * selectedPreset.qualifyingDayProfitPercent) / 100 : null;

  const handleCreateAccountSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newAccount = createAccountFromPreset(
      selectedPreset,
      effectiveAccountSize,
      customAccountName.trim() || undefined,
      selectedAccountLink
    );
    addPropFirmAccount(newAccount);
    setSelectedPropFirmAccountId(newAccount.id);
    setIsAddAccountModalOpen(false);
    setCustomAccountName('');
    setCustomAccountSizeInput('');
    addToast('Account Created', `Created ${newAccount.name} successfully`, 'success');
  };

  const handleOpenEditModal = () => {
    if (!activeAccount) return;
    setEditAccountName(activeAccount.name);
    setEditStartingBalance(activeAccount.startingBalance);
    setEditDailyLossPercent(activeAccount.dailyLossPercent || 4);
    setEditTotalLossPercent(activeAccount.totalLossPercent || 10);
    setEditTargetPercent(activeAccount.profitTargetPercent || 0);
    setEditEnforcementMode(activeAccount.enforcementMode || 'MONITOR');
    setIsEditAccountModalOpen(true);
  };

  const handleEditAccountSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeAccount) return;
    const updated: PropFirmAccount = {
      ...activeAccount,
      name: editAccountName.trim() || activeAccount.name,
      startingBalance: editStartingBalance,
      profitTargetPercent: editTargetPercent,
      dailyLossPercent: editDailyLossPercent,
      totalLossPercent: editTotalLossPercent,
      enforcementMode: editEnforcementMode,
    };
    updatePropFirmAccount(updated);
    setIsEditAccountModalOpen(false);
    addToast('Account Saved', `${updated.name} updated successfully`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1300px] w-full mx-auto space-y-6 animate-fadeIn text-zinc-100">
      {!activeAccount ? (
        <div className="p-8 rounded-2xl bg-[#0a0e10] border border-[#000000] text-center space-y-4">
          <Shield className="w-12 h-12 text-zinc-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-100">No Prop Firm Accounts Configured</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Create an evaluation account or load an institutional rule template (LegionFunding, FTMO, Topstep, Apex) to begin live compliance tracking.
          </p>
          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-white text-sm font-semibold transition cursor-pointer active:scale-95 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Prop Firm Account
          </button>
        </div>
      ) : (
        <>
          {/* Top Header Card: 1300px width, #0a0e10 bg, #000000 border */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#2c4273]/20 border border-[#2c4273]/40">
                  <Shield className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 text-left">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      Prop Firm Hub
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2c4273]/30 border border-[#2c4273] text-blue-300">
                      Data-Driven Rules Engine
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 text-left">
                    Institutional risk state monitor, LegionFunding rules engine & multi-account compliance matrix.
                  </p>
                </div>
              </div>
            </div>

            {/* Account Selector Pills & New Account Button (#2c4273) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                {propFirmAccounts.map((acc) => {
                  const isSelected = acc.id === activeAccount.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedPropFirmAccountId(acc.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#2c4273] text-white shadow-md border border-blue-400/50'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{acc.name}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
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
                onClick={handleOpenEditModal}
                title="Edit Account Rules & Settings"
                className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold transition cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${activeAccount.name}"?`)) {
                    deletePropFirmAccount(activeAccount.id);
                    addToast('Account Removed', `${activeAccount.name} deleted`, 'info');
                  }
                }}
                title="Delete Prop Firm Account"
                className="p-2.5 rounded-2xl bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/50 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2c4273] hover:bg-[#354f8a] text-white text-xs font-bold transition shadow-lg active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>

      {/* Legal Entity & Institution Banner for LegionFunding */}
      <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Building className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="space-x-2">
            <span className="font-bold text-white">Legal Entity:</span>
            <span className="text-slate-300">{activeAccount.legalEntity || 'Hyper Funded Ltd.'}</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold text-white">Trading Brand:</span>
            <span className="text-slate-300">{activeAccount.tradingBrand || activeAccount.firmName}</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold text-white">Registration:</span>
            <span className="font-mono text-blue-300">{activeAccount.registrationNumber || '2026-00324'}</span>
            <span className="text-slate-600">•</span>
            <span className="font-bold text-white">Jurisdiction:</span>
            <span className="text-slate-300">{activeAccount.jurisdiction || 'Saint Lucia'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Effective: {activeAccount.termsEffectiveDate || '1 July 2026'}</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
            Mode: {activeAccount.enforcementMode || 'MONITOR'}
          </span>
        </div>
      </div>

      {/* Live Risk State & Advice Banner */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border transition backdrop-blur-2xl ${
          evaluation?.riskState === 'SAFE'
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : evaluation?.riskState === 'WARNING'
            ? 'bg-amber-950/20 border-amber-500/35'
            : evaluation?.riskState === 'CRITICAL'
            ? 'bg-rose-950/25 border-rose-500/45'
            : 'bg-red-950/30 border-red-500/50'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4 text-left">
            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/15 shrink-0">
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
              className="px-3.5 py-2 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-xs font-bold text-white transition flex items-center gap-2 shadow-xs"
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4 shadow-xl text-left">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Account Balance</span>
            <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 font-mono text-[11px] border border-white/10">
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4 shadow-xl text-left">
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
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4 shadow-xl text-left">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Daily Loss Limit</span>
            <span className="px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 font-mono text-[11px] border border-white/10">
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
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyDrawdownData && dailyDrawdownData.remainingDailyBufferPercent < 30
                    ? 'bg-rose-500'
                    : dailyDrawdownData && dailyDrawdownData.remainingDailyBufferPercent < 60
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (dailyDrawdownData?.remainingDailyBufferPercent || 0)))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Daily Buffer</span>
            <span className="font-mono font-bold text-slate-200">
              {formatCurrency(dailyDrawdownData?.remainingDailyBuffer || 0)} ({(dailyDrawdownData?.remainingDailyBufferPercent ?? 0).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Card 4: Maximum Drawdown & Buffer */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4 shadow-xl text-left">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Max Drawdown</span>
            <span className="px-2 py-0.5 rounded bg-[#2c4273]/30 text-blue-300 font-mono text-[10px] font-bold border border-[#2c4273]">
              {activeAccount.drawdownModel.replace('_', ' ')}
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono flex items-baseline justify-between">
              <span className={maxDrawdownData?.currentDrawdown ? 'text-amber-400' : 'text-slate-100'}>
                {formatCurrency(maxDrawdownData?.currentDrawdown || 0)}
              </span>
              <span className="text-xs font-semibold text-slate-500 font-mono">
                / {formatCurrency(activeAccount.rules.find((r) => r.type === 'MAX_DRAWDOWN')?.threshold || 5000)}
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  maxDrawdownData && maxDrawdownData.bufferPercent < 30
                    ? 'bg-rose-500'
                    : maxDrawdownData && maxDrawdownData.bufferPercent < 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (maxDrawdownData?.bufferPercent || 0)))}%` }}
              />
            </div>
          </div>
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>Remaining Buffer</span>
            <span className="font-mono font-bold text-slate-200">
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
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
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
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Pre-Trade Order Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('days')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'days'
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Trading Days ({tradingDaysData?.daysCompleted || 0}/{tradingDaysData?.minDaysRequired || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('exposures')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'exposures'
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-emerald-400" />
          <span>Symbol Risk & Durations</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rule Configuration & Presets</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payouts & Reward Split ({activeAccount.rewardSplitPercent || 80}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('violations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
            activeTab === 'violations'
              ? 'bg-[#2c4273] text-white border-blue-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Violations & Audit Logs ({activeAccount.violations.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: Rule Health Center Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0a0e10] border border-[#000000] overflow-hidden shadow-2xl text-left">
            <div className="p-5 sm:p-6 bg-white/[0.03] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>LegionFunding Institutional Compliance Matrix</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Live status, threshold boundaries and calculation transparent formulas.
                </p>
              </div>
              <button
                onClick={() => setIsAddRuleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-white text-xs font-bold transition shadow-sm active:scale-95"
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
                    <div className="space-y-1.5 max-w-xl text-left">
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
                        <span>
                          Formula:{' '}
                          <code className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[11px] font-mono">
                            {rule.calculationMethodology}
                          </code>
                        </span>
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
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-950/80 border border-red-500/60 text-red-300">
                            BREACHED
                          </span>
                        ) : isCrit ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300">
                            CRITICAL
                          </span>
                        ) : isWarn ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                            WARNING
                          </span>
                        ) : rule.status === 'COMPLETED' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/50 border border-emerald-500/40 text-emerald-400">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
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
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Quantity / Contracts</label>
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

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Total Dollar Risk:</span>
                <span className="text-rose-400 font-bold">
                  {formatCurrency(preTradeQuantity * preTradeStopLossPoints * preTradePointMultiplier)}
                </span>
              </div>

              <button
                onClick={handleRunPreTradeCheck}
                className="w-full py-2.5 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Shield className="w-4 h-4" />
                <span>Evaluate Prop Firm Rules</span>
              </button>
            </div>
          </div>

          {/* Validation Result Box */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
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
                    Rule-by-Rule Compliance Checks
                  </span>
                  <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/30">
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
                <p className="text-xs">
                  Configure your simulated trade parameters and click "Evaluate Prop Firm Rules" to run pre-trade validation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Trading Days & Qualifying Days */}
      {activeTab === 'days' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          {/* Trading Days Tracker */}
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Trading Day & Qualifying Day Tracker</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-950/60 border border-purple-500/30 text-purple-300">
                {tradingDaysData?.daysCompleted} / {tradingDaysData?.minDaysRequired} Days
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              LegionFunding rule: Minimum 3 active days. A qualifying trading day requires at least 0.5% realized profit ($250 on $50K).
            </p>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-400">Requirement Status:</span>
                <span className={tradingDaysData?.isSatisfied ? 'text-emerald-400' : 'text-amber-400'}>
                  {tradingDaysData?.isSatisfied
                    ? 'Minimum Days Satisfied'
                    : `${tradingDaysData?.daysRemaining} more trading days needed`}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((tradingDaysData?.daysCompleted || 0) / (tradingDaysData?.minDaysRequired || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Session Calendar Breakdown</span>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {tradingDaysData?.dailyBreakdown.map((d, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-zinc-200 font-bold">{d.date}</span>
                      <span className="ml-3 font-mono text-xs text-slate-400">P&L: {formatCurrency(d.netPnl)}</span>
                    </div>
                    {d.isQualifying ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Qualifying Day (+0.5%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Active Day
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consistency Rule Engine */}
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
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
            <p className="text-xs text-zinc-400 leading-relaxed">
              Formula: <code>(Highest Single Day Profit / Total Accumulated Profit) × 100</code>. No single day can exceed {consistencyData?.allowedPercent}%.
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
                    (consistencyData?.consistencyPercent || 0) > (consistencyData?.allowedPercent || 20)
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, consistencyData?.consistencyPercent || 0)}%`,
                  }}
                />
              </div>
            </div>

            {consistencyData && !consistencyData.isCompliant && (
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Consistency Adjustment Needed</span>
                </div>
                <p>
                  You need to generate an additional <strong>{formatCurrency(consistencyData.additionalProfitNeeded)}</strong> in profit across other trading days to reduce best-day concentration below {consistencyData.allowedPercent}%.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Symbol Exposure Risk & Trade Durations */}
      {activeTab === 'exposures' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
          {/* Symbol Exposure Card */}
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Max Risk Exposure Per Symbol</span>
            </h3>
            <p className="text-xs text-zinc-400">
              LegionFunding constraint: Combined open and closed risk exposure on a single symbol must not exceed {activeAccount.maxRiskPerSymbolPercent || 2}% of initial balance (${formatCurrency(activeAccount.startingBalance * ((activeAccount.maxRiskPerSymbolPercent || 2) / 100))}).
            </p>

            <div className="space-y-2 pt-2">
              {symbolRiskData.length > 0 ? (
                symbolRiskData.map((sym, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{sym.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({sym.totalTradesCount} trades)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Realized PnL: <span className={sym.realizedPnl >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{formatCurrency(sym.realizedPnl)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-zinc-200 font-bold">
                        Risk: {formatCurrency(sym.potentialRiskDollar)} / {formatCurrency(sym.maxAllowedRiskDollar)}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sym.status === 'SAFE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : sym.status === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                      }`}>
                        {sym.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No symbol executions logged yet for risk exposure monitoring.
                </div>
              )}
            </div>
          </div>

          {/* Trade Duration Check */}
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Trade Duration Engine (Min 60 Seconds)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              LegionFunding rule: Positions must be held open for at least {durationData?.minRequiredSec || 60} seconds to prevent high-frequency tick scalping.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Trade Duration</span>
                <span className="text-lg font-bold font-mono text-zinc-100">
                  {Math.floor((durationData?.avgTradeDurationSec || 0) / 60)}m {(durationData?.avgTradeDurationSec || 0) % 60}s
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Duration Breaches</span>
                <span className={`text-lg font-bold font-mono ${(durationData?.durationBreachesCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {durationData?.durationBreachesCount || 0} Trades
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Execution Audit</span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {durationData?.details.map((t, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-200">{t.symbol}</span>
                    <span className="font-mono text-zinc-400">{t.durationText}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.isCompliant ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                      {t.isCompliant ? 'COMPLIANT' : 'BREACH (< 60s)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: Rule Configuration & Presets */}
      {activeTab === 'rules' && (
        <div className="space-y-6 text-left">
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Configurable Prop Firm Parameters</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Customize loss calculation methods, enforcement modes, or load official LegionFunding presets.
                </p>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2c4273] hover:bg-[#354f8a] text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Preset Templates</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-400 block">Enforcement Mode</label>
                <select
                  value={activeAccount.enforcementMode || 'MONITOR'}
                  onChange={(e) => updatePropFirmAccount({ ...activeAccount, enforcementMode: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="MONITOR">MONITOR (Soft Warnings & Alerts)</option>
                  <option value="STRICT">STRICT (Hard Circuit Breakers)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-400 block">Daily Loss Method</label>
                <select
                  value={activeAccount.dailyLossMethod || 'REALIZED_ONLY'}
                  onChange={(e) => updatePropFirmAccount({ ...activeAccount, dailyLossMethod: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="REALIZED_ONLY">REALIZED ONLY (Closed Trades)</option>
                  <option value="REALIZED_PLUS_FLOATING">REALIZED + FLOATING</option>
                  <option value="START_OF_DAY_BALANCE">START OF DAY BALANCE</option>
                  <option value="START_OF_DAY_EQUITY">START OF DAY EQUITY</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-400 block">Drawdown Model</label>
                <select
                  value={activeAccount.drawdownModel}
                  onChange={(e) => updatePropFirmAccount({ ...activeAccount, drawdownModel: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="STATIC">STATIC (Initial Balance Fixed)</option>
                  <option value="EOD_TRAILING">EOD TRAILING (End-of-day peak)</option>
                  <option value="INTRADAY_HWM_TRAILING">INTRADAY HWM TRAILING (Live high water)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Active Rules List</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAccount.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3"
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
        </div>
      )}

      {/* TAB CONTENT 6: Payouts & Profit Split */}
      {activeTab === 'payouts' && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Eligible Net Profit</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(payoutData?.eligibleProfit || 0)}
              </div>
              <span className="text-xs text-zinc-400">Above starting balance</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Trader Share ({payoutData?.rewardSplitPercent || 80}%)</span>
              <div className="text-2xl font-black font-mono text-white">
                {formatCurrency(payoutData?.traderShare || 0)}
              </div>
              <span className="text-xs text-zinc-400">80% Payout split</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Firm Share (20%)</span>
              <div className="text-2xl font-black font-mono text-slate-400">
                {formatCurrency(payoutData?.firmShare || 0)}
              </div>
              <span className="text-xs text-zinc-400">Hyper Funded Ltd.</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Reward Claim Status</span>
              <button
                disabled={!payoutData?.isEligibleForRequest}
                onClick={() => setIsPayoutModalOpen(true)}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition flex items-center justify-center gap-2 ${
                  payoutData?.isEligibleForRequest
                    ? 'bg-[#2c4273] hover:bg-[#354f8a]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Submit Reward Request</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0e10] border border-[#000000] flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="font-bold text-white">Reward Buffer Policy:</span>
              <p className="text-slate-400">
                {payoutData?.rewardBufferPercent ? `Must hold a 3% profit buffer ($${payoutData.rewardBufferAmount}) before first payout.` : 'No active reward buffer restriction for this model.'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full font-bold ${payoutData?.rewardBufferMet ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'}`}>
              {payoutData?.rewardBufferMet ? 'Buffer Satisfied' : 'Buffer Pending'}
            </span>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: Violations & Audit Logs */}
      {activeTab === 'violations' && (
        <div className="space-y-6 text-left">
          <div className="p-6 rounded-2xl bg-[#0a0e10] border border-[#000000] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Historical Rule Violations & Prohibited Behavior Monitor</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">Inactivity Rule Monitor (30 Days)</span>
                <div className="text-sm font-mono text-slate-300">
                  Days Inactive: <strong className="text-white">{inactivityData?.daysInactive} days</strong> (Max: 30)
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inactivityData?.status === 'SAFE' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                  {inactivityData?.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-300 block">News Trading Audit</span>
                <div className="text-sm font-mono text-slate-300">
                  Violating Trades: <strong className="text-emerald-400">{newsData?.violatingTradesCount || 0}</strong> (5m Window)
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400">
                  Compliant Window
                </span>
              </div>
            </div>

            {activeAccount.violations.length > 0 ? (
              <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
                {activeAccount.violations.map((v) => (
                  <div key={v.id} className="p-4 space-y-1.5 bg-zinc-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400">{v.ruleName}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{new Date(v.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-zinc-300">{v.explanation}</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                      <span>Actual: <strong className="text-rose-400">{v.actualValue}</strong></span>
                      <span>Allowed: <strong className="text-zinc-300">{v.allowedValue}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-emerald-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                <p className="font-bold">Zero Violations Recorded</p>
                <p className="text-zinc-500">Account has maintained 100% compliance across all active rules.</p>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* MODAL 1: Add New Account / LegionFunding Preset Selection */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0e10] border border-[#000000] rounded-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Create Prop Firm Account</span>
              </h3>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Select Model Preset */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                1. Select Model / Program Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {LEGION_FUNDING_PRESETS.map((tmpl) => {
                  const isSelected = tmpl.id === selectedPresetId;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedPresetId(tmpl.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#2c4273]/30 border-blue-400 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-zinc-100">{tmpl.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          Target: {tmpl.profitTargetPercent > 0 ? `${tmpl.profitTargetPercent}%` : 'None'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          Daily: {tmpl.dailyLossPercent}%
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                          Total: {tmpl.totalLossPercent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Account Size */}
            <div className="space-y-2 pt-1 border-t border-zinc-800/80">
              <label className="text-xs font-bold text-zinc-300 block">
                2. Select Account Size
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[5000, 10000, 25000, 50000, 100000, 200000].map((size) => {
                  const isSelected = selectedAccountSize === size && !customAccountSizeInput;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedAccountSize(size);
                        setCustomAccountSizeInput('');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold transition text-center border cursor-pointer ${
                        isSelected
                          ? 'bg-[#2c4273] text-white border-blue-400 shadow'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      ${(size / 1000).toFixed(0)}K
                    </button>
                  );
                })}
              </div>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-xs text-zinc-400 shrink-0">Custom Size ($):</span>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={customAccountSizeInput}
                  onChange={(e) => setCustomAccountSizeInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* STEP 3: Live Dynamic Dollar Rules Calculation Card */}
            <div className="p-4 rounded-xl bg-black/50 border border-zinc-800 space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Calculated Rule Thresholds (${effectiveAccountSize.toLocaleString()} Account)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-slate-300">
                <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block font-sans">Starting Balance</span>
                  <span className="font-bold text-white">${effectiveAccountSize.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block font-sans">Profit Target</span>
                  <span className="font-bold text-emerald-400">
                    {selectedPreset.profitTargetPercent > 0 ? `$${calcTarget.toLocaleString()} (${selectedPreset.profitTargetPercent}%)` : 'None'}
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block font-sans">Daily Loss Limit</span>
                  <span className="font-bold text-rose-400">
                    ${calcDailyLoss.toLocaleString()} ({selectedPreset.dailyLossPercent}%)
                  </span>
                </div>
                <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block font-sans">Max Total Loss</span>
                  <span className="font-bold text-rose-400">
                    ${calcTotalLoss.toLocaleString()} ({selectedPreset.totalLossPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 4: Optional Custom Details & Account Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Account Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g. ${selectedPreset.firmName} $${(effectiveAccountSize/1000).toFixed(0)}K`}
                  value={customAccountName}
                  onChange={(e) => setCustomAccountName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Link to Trading Account</label>
                <select
                  value={selectedAccountLink}
                  onChange={(e) => setSelectedAccountLink(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Closed Trades (Default)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.broker || 'Broker'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateAccountSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-white text-xs font-bold transition shadow-lg cursor-pointer active:scale-95"
              >
                Create Prop Firm Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Existing Prop Firm Account */}
      {isEditAccountModalOpen && activeAccount && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a0e10] border border-[#000000] rounded-2xl w-full max-w-lg p-6 space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>Edit Account Parameters</span>
              </h3>
              <button
                onClick={() => setIsEditAccountModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1">Account Name</label>
                <input
                  type="text"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Starting Balance ($)</label>
                  <input
                    type="number"
                    value={editStartingBalance}
                    onChange={(e) => setEditStartingBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Enforcement Mode</label>
                  <select
                    value={editEnforcementMode}
                    onChange={(e) => setEditEnforcementMode(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="MONITOR">MONITOR (Alerts Only)</option>
                    <option value="HARD_BREACH">HARD_BREACH (Locking)</option>
                    <option value="DISABLED">DISABLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Profit Target %</label>
                  <input
                    type="number"
                    value={editTargetPercent}
                    onChange={(e) => setEditTargetPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Daily Loss %</label>
                  <input
                    type="number"
                    value={editDailyLossPercent}
                    onChange={(e) => setEditDailyLossPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-300 block mb-1">Total Loss %</label>
                  <input
                    type="number"
                    value={editTotalLossPercent}
                    onChange={(e) => setEditTotalLossPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditAccountModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditAccountSubmit}
                className="px-5 py-2 rounded-xl bg-[#2c4273] hover:bg-[#354f8a] text-white text-xs font-bold transition shadow-lg cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
