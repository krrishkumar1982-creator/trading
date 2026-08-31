import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  SlidersHorizontal,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Clock,
  Calendar,
  BarChart2,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { calculateComprehensiveMetrics } from '../../lib/calcEngine';
import { MultiSegmentSemicircleGauge, ProfitFactorDonut } from './SemicircleGauge';
import { RadarScoreCard } from './RadarScoreCard';
import { ProgressTrackerCard } from './ProgressTrackerCard';
import { CumulativePnlChart } from './CumulativePnlChart';
import { DailyPnlBarChart } from './DailyPnlBarChart';
import { AccountBalanceChart } from './AccountBalanceChart';
import { PerformanceCalendar } from './PerformanceCalendar';
import { DrawdownChart } from './DrawdownChart';
import { TradeTimePerformanceChart } from './TradeTimePerformanceChart';
import { DashboardInfoTooltip, METRIC_INFOS } from './DashboardInfoTooltip';
import { Trade } from '../../types';

interface DashboardViewProps {
  onSelectTrade: (trade: Trade) => void;
  onOpenImport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTrade, onOpenImport }) => {
  const {
    filteredTrades,
    formatCurrency,
    formatRMultiple,
    setIsAddTradeOpen,
    setActiveView,
    accounts,
    selectedAccountId,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  const [dashboardMode, setDashboardMode] = useState<'overview' | 'calendar'>('overview');
  const [activeTab, setActiveTab] = useState<'recent' | 'open'>('recent');
  const [isEditWidgetsOpen, setIsEditWidgetsOpen] = useState(false);

  // Widget visibility state
  const [widgets, setWidgets] = useState({
    kpis: true,
    scoreCard: true,
    progressTracker: true,
    cumulativeChart: true,
    dailyBarChart: true,
    positionsTable: true,
    accountBalance: true,
    calendar: true,
    drawdown: true,
    tradeTimePerformance: true,
  });

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Separate Closed and Open Trades
  const closedTrades = useMemo(() => {
    return filteredTrades.filter(t => t.status === 'CLOSED');
  }, [filteredTrades]);

  const openTrades = useMemo(() => {
    return filteredTrades.filter(t => t.status === 'OPEN');
  }, [filteredTrades]);

  // Real Trade Metrics Calculation using Unified Financial Engine
  const metrics = useMemo(() => {
    const startingCap = selectedAccount?.initialBalance || 50000;
    const m = calculateComprehensiveMetrics(closedTrades, { initialBalance: startingCap });
    const accountGrowthPercent = startingCap > 0 ? (m.netPnl / startingCap) * 100 : 0;

    return {
      totalNetPnl: m.netPnl,
      winTradesCount: m.winningTrades,
      lossTradesCount: m.losingTrades,
      beTradesCount: m.breakevenTrades,
      totalTradesCount: m.closedTrades,
      tradeWinRate: m.winRate !== null ? m.winRate : m.allTradesWinRate,
      grossProfit: m.grossProfit,
      grossLoss: m.grossLoss,
      profitFactor: m.profitFactor !== null && isFinite(m.profitFactor) ? m.profitFactor : (m.grossProfit > 0 ? 99.9 : 0),
      avgWin: m.avgWinningTrade,
      avgLoss: m.avgLosingTrade,
      avgWinLossRatio: m.payoffRatio !== null && isFinite(m.payoffRatio) ? m.payoffRatio : (m.avgWinningTrade > 0 ? m.avgWinningTrade : 0),
      winDays: m.winningDays,
      lossDays: m.losingDays,
      beDays: m.breakevenDays,
      totalDays: m.totalTradingDays,
      dayWinRate: m.dayWinRate !== null ? m.dayWinRate : 0,
      accountGrowthPercent,
    };
  }, [closedTrades, selectedAccount]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}>
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono tracking-wide bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border border-[rgba(37,99,255,0.25)]">
              LIVE PORTFOLIO
            </span>
          </div>
          <p className={`text-xs mt-1 flex items-center gap-2 ${
            isLight ? 'text-[#6B7280]' : 'text-[#8C97AB]'
          }`}>
            <span>Real-time trading performance & execution analytics</span>
            <span className={isLight ? 'text-[#D1D5DB]' : 'text-[#20283A]'}>•</span>
            <span className={`font-mono font-medium ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>
              {closedTrades.length} closed trades recorded
            </span>
          </p>
        </div>

        {/* Dashboard View Mode Tabs + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-1 p-1 rounded-lg border transition ${
            isLight
              ? 'bg-[#F1F5F9] border-[#E5E7EB]'
              : 'bg-[#0D111B] border-[#20283A]'
          }`}>
            <button
              onClick={() => setDashboardMode('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                dashboardMode === 'overview'
                  ? isLight
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB]'
                    : 'bg-[#2563FF] text-white'
                  : isLight
                    ? 'text-[#4B5563] hover:text-[#111827]'
                    : 'text-[#8C97AB] hover:text-[#F3F6FB]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setDashboardMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                dashboardMode === 'calendar'
                  ? isLight
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB]'
                    : 'bg-[#2563FF] text-white'
                  : isLight
                    ? 'text-[#4B5563] hover:text-[#111827]'
                    : 'text-[#8C97AB] hover:text-[#F3F6FB]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setIsEditWidgetsOpen(true)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
                : 'border-[#20283A] bg-[#0D111B] text-[#8C97AB] hover:text-[#F3F6FB] hover:border-[#28344A]'
            }`}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${isLight ? 'text-[#6B7280]' : 'text-[#7F8BA0]'}`} />
            <span>Customize</span>
          </button>
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 rounded-lg bg-[#2563FF] hover:bg-[#2F6BFF] text-white px-3.5 py-1.5 text-xs font-semibold transition active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Trades</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Trading Calendar & Execution Time Analytics Focused View */}
      {dashboardMode === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-in fade-in">
          {/* Left: Monthly Trading Calendar with Attached Weekly Summary Cards (8 cols on xl) */}
          {widgets.calendar && (
            <div className="xl:col-span-8">
              <PerformanceCalendar
                trades={closedTrades}
                formatCurrency={formatCurrency}
                formatRMultiple={formatRMultiple}
                onSelectTrade={onSelectTrade}
              />
            </div>
          )}

          {/* Right: Drawdown Curve & Trade Time Performance Scatter Plot (4 cols on xl) */}
          <div className="xl:col-span-4 space-y-5">
            {widgets.drawdown && (
              <DrawdownChart
                trades={closedTrades}
                formatCurrency={formatCurrency}
              />
            )}
            {widgets.tradeTimePerformance && (
              <TradeTimePerformanceChart
                trades={closedTrades}
                formatCurrency={formatCurrency}
                onSelectTrade={onSelectTrade}
              />
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Executive Overview Widgets Suite (Default Visible) */}
      {dashboardMode === 'overview' && (
        <div className="space-y-6 animate-in fade-in">

      {/* Top 5 KPI Cards Row */}
      {widgets.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Net P&L Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B] hover:border-[#28344A]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
              }`}>
                Net P&L <DashboardInfoTooltip info={METRIC_INFOS.netPnl} />
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold font-mono ${
                isLight
                  ? 'bg-[#F1F5F9] text-[#4B5563] border border-[#E5E7EB]'
                  : 'bg-[#111722] text-[#8C97AB] border border-[#20283A]'
              }`}>
                {metrics.totalTradesCount} trades
              </span>
            </div>
            <div className="flex items-center justify-between my-2.5">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                metrics.totalNetPnl >= 0
                  ? isLight ? 'text-[#059669]' : 'text-[#00D6A3]'
                  : isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'
              }`}>
                {formatCurrency(metrics.totalNetPnl)}
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight
                  ? 'bg-[rgba(37,99,255,0.08)] border border-[rgba(37,99,255,0.20)] text-[#1D4ED8]'
                  : 'bg-[rgba(37,99,255,0.10)] border border-[rgba(37,99,255,0.20)] text-[#4C7DFF]'
              }`}>
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-[11px] flex items-center justify-between font-mono pt-2 border-t ${
              isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
            }`}>
              <span>Account Growth</span>
              <span className={`font-bold ${
                (metrics.accountGrowthPercent ?? 0) >= 0
                  ? isLight ? 'text-[#059669]' : 'text-[#00D6A3]'
                  : isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'
              }`}>
                {(metrics.accountGrowthPercent ?? 0) >= 0 ? '+' : ''}{(metrics.accountGrowthPercent ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 2. Trade Win % Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B] hover:border-[#28344A]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
              }`}>
                Trade Win % <DashboardInfoTooltip info={METRIC_INFOS.tradeWinRate} />
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                {(metrics.tradeWinRate ?? 0).toFixed(1)}%
              </div>
              <MultiSegmentSemicircleGauge
                wins={metrics.winTradesCount}
                breakevens={metrics.beTradesCount}
                losses={metrics.lossTradesCount}
                size={68}
                strokeWidth={6}
              />
            </div>
            {/* Pill breakdown underneath gauge */}
            <div className={`flex items-center justify-between text-[11px] font-mono pt-2 border-t ${
              isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
            }`}>
              <span className="text-[10px] uppercase font-semibold text-[#5F6B80]">Record</span>
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isLight ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[rgba(0,214,163,0.12)] text-[#00D6A3] border border-[rgba(0,214,163,0.25)]'
                }`}>
                  {metrics.winTradesCount}W
                </span>
                {metrics.beTradesCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isLight ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8]' : 'bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border border-[rgba(37,99,255,0.25)]'
                  }`}>
                    {metrics.beTradesCount}BE
                  </span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isLight ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[rgba(255,61,110,0.12)] text-[#FF3D6E] border border-[rgba(255,61,110,0.25)]'
                }`}>
                  {metrics.lossTradesCount}L
                </span>
              </div>
            </div>
          </div>

          {/* 3. Profit Factor Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B] hover:border-[#28344A]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
              }`}>
                Profit Factor <DashboardInfoTooltip info={METRIC_INFOS.profitFactor} />
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                {(metrics.profitFactor ?? 0).toFixed(2)}
              </div>
              <ProfitFactorDonut
                grossProfit={metrics.grossProfit}
                grossLoss={metrics.grossLoss}
                profitFactor={metrics.profitFactor}
                size={52}
                strokeWidth={5.5}
              />
            </div>
            {/* Gross profit and loss breakdown */}
            <div className={`text-[11px] flex items-center justify-between font-mono pt-2 border-t ${
              isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
            }`}>
              <span>
                W: <strong className={isLight ? 'text-[#059669] font-bold' : 'text-[#00D6A3] font-bold'}>
                  ${Math.round(metrics.grossProfit).toLocaleString()}
                </strong>
              </span>
              <span>
                L: <strong className={isLight ? 'text-[#DC2626] font-bold' : 'text-[#FF3D6E] font-bold'}>
                  -${Math.round(metrics.grossLoss).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>

          {/* 4. Day Win % Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B] hover:border-[#28344A]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
              }`}>
                Day Win % <DashboardInfoTooltip info={METRIC_INFOS.dayWinRate} />
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                {(metrics.dayWinRate ?? 0).toFixed(1)}%
              </div>
              <MultiSegmentSemicircleGauge
                wins={metrics.winDays}
                breakevens={metrics.beDays}
                losses={metrics.lossDays}
                size={68}
                strokeWidth={6}
              />
            </div>
            {/* Day counts pill breakdown */}
            <div className={`flex items-center justify-between text-[11px] font-mono pt-2 border-t ${
              isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
            }`}>
              <span className="text-[10px] uppercase font-semibold text-[#5F6B80]">Days</span>
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isLight ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[rgba(0,214,163,0.12)] text-[#00D6A3] border border-[rgba(0,214,163,0.25)]'
                }`}>
                  {metrics.winDays} Green
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isLight ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[rgba(255,61,110,0.12)] text-[#FF3D6E] border border-[rgba(255,61,110,0.25)]'
                }`}>
                  {metrics.lossDays} Red
                </span>
              </div>
            </div>
          </div>

          {/* 5. Avg Win / Loss Trade Card */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B] hover:border-[#28344A]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
              }`}>
                Avg Win/Loss <DashboardInfoTooltip info={METRIC_INFOS.avgWinLoss} />
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                {(metrics.avgWinLossRatio ?? 0).toFixed(2)}
              </div>
              {/* Dual horizontal ratio bar */}
              <div className="w-20 flex flex-col gap-1">
                <div className={`h-2 w-full rounded-full overflow-hidden flex ${
                  isLight ? 'bg-[#E5E7EB]' : 'bg-[#111722]'
                }`}>
                  <div
                    className={`${isLight ? 'bg-[#059669]' : 'bg-[#00D6A3]'} h-full transition-all`}
                    style={{ width: `${(metrics.avgWin / (metrics.avgWin + metrics.avgLoss || 1)) * 100}%` }}
                  />
                  <div
                    className={`${isLight ? 'bg-[#DC2626]' : 'bg-[#FF3D6E]'} h-full transition-all`}
                    style={{ width: `${(metrics.avgLoss / (metrics.avgWin + metrics.avgLoss || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={`text-[11px] flex items-center justify-between font-mono pt-2 border-t ${
              isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#8C97AB] border-[#20283A]'
            }`}>
              <span className={isLight ? 'text-[#059669] font-bold' : 'text-[#00D6A3] font-bold'}>
                +${Math.round(metrics.avgWin).toLocaleString()}
              </span>
              <span className={isLight ? 'text-[#DC2626] font-bold' : 'text-[#FF3D6E] font-bold'}>
                -${Math.round(metrics.avgLoss).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row (3 Columns: TradeForge Score, Progress Tracker, Cumulative P&L) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: TradeForge Radar Score */}
        {widgets.scoreCard && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                TradeForge Score <DashboardInfoTooltip info={METRIC_INFOS.tradeForgeScore || METRIC_INFOS.duskFlowScore} />
              </span>
            </div>
            <RadarScoreCard trades={closedTrades} />
          </div>
        )}

        {/* Card 2: Progress Tracker Activity Heatmap */}
        {widgets.progressTracker && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                Progress Tracker <DashboardInfoTooltip info={METRIC_INFOS.progressTracker} />
              </span>
              <button
                onClick={() => setActiveView('calendar')}
                className={`text-[11px] font-semibold transition ${
                  isLight ? 'text-[#1D4ED8] hover:text-[#1E40AF]' : 'text-[#4C7DFF] hover:text-[#7096FF]'
                }`}
              >
                View Full Calendar →
              </button>
            </div>
            <ProgressTrackerCard trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}

        {/* Card 3: Daily Net Cumulative P&L */}
        {widgets.cumulativeChart && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                Daily Cumulative Equity <DashboardInfoTooltip info={METRIC_INFOS.cumulativePnl} />
              </span>
              <span className={`text-xs font-mono font-bold ${
                metrics.totalNetPnl >= 0
                  ? isLight ? 'text-[#059669]' : 'text-[#00D6A3]'
                  : isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'
              }`}>
                {formatCurrency(metrics.totalNetPnl)}
              </span>
            </div>
            <CumulativePnlChart trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}
      </div>

      {/* Bottom Row (3 Columns: Net Daily P&L, Recent Trades/Open Positions, Account Balance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Net Daily P&L */}
        {widgets.dailyBarChart && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition min-w-0 overflow-hidden ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                Net Daily P&L Distribution <DashboardInfoTooltip info={METRIC_INFOS.netDailyPnl} />
              </span>
            </div>
            <DailyPnlBarChart trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}

        {/* 2. Recent Trades / Open Positions Tabs */}
        {widgets.positionsTable && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition min-w-0 overflow-hidden ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div>
              {/* Tab Selector */}
              <div className={`flex items-center gap-4 border-b pb-3 mb-3 ${
                isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
              }`}>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`text-xs font-semibold pb-0.5 transition relative ${
                    activeTab === 'recent'
                      ? isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'
                      : isLight ? 'text-[#4B5563] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'
                  }`}
                >
                  Recent Executions
                  {activeTab === 'recent' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full -mb-3 bg-[#2563FF]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('open')}
                  className={`text-xs font-semibold pb-0.5 transition relative ${
                    activeTab === 'open'
                      ? isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'
                      : isLight ? 'text-[#4B5563] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'
                  }`}
                >
                  Open Positions ({openTrades.length})
                  {activeTab === 'open' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full -mb-3 bg-[#2563FF]" />
                  )}
                </button>
              </div>

              {/* Table Header */}
              <div className={`grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg ${
                isLight ? 'bg-[#F1F5F9] text-[#4B5563]' : 'bg-[#111722] text-[#8C97AB] border border-[#20283A]'
              }`}>
                <span>Close Date</span>
                <span>Symbol / Side</span>
                <span className="text-right">Net P&L</span>
              </div>

              {/* Table Rows */}
              <div className="space-y-1 mt-2 max-h-[190px] overflow-y-auto custom-scrollbar">
                {(activeTab === 'recent' ? closedTrades.slice(0, 5) : openTrades).map(trade => (
                  <div
                    key={trade.id}
                    onClick={() => onSelectTrade(trade)}
                    className={`grid grid-cols-3 items-center px-3 py-2 rounded-lg border cursor-pointer transition text-xs ${
                      isLight
                        ? 'bg-[#F8FAFC] border-[#E5E7EB] hover:border-[#CBD5E1] text-[#111827]'
                        : 'bg-[#0A0E16] border-[#20283A] hover:border-[#28344A] text-[#F3F6FB]'
                    }`}
                  >
                    <span className={`font-mono text-[11px] ${
                      isLight ? 'text-[#4B5563]' : 'text-[#8C97AB]'
                    }`}>
                      {trade.exitDate
                        ? new Date(trade.exitDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : trade.entryDate
                        ? new Date(trade.entryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : 'Open'}
                    </span>
                    <span className={`font-semibold flex items-center gap-1.5 ${
                      isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
                    }`}>
                      {trade.symbol}
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        trade.direction === 'BUY'
                          ? isLight ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' : 'bg-[rgba(0,214,163,0.12)] text-[#00D6A3] border border-[rgba(0,214,163,0.25)]'
                          : isLight ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' : 'bg-[rgba(255,61,110,0.12)] text-[#FF3D6E] border border-[rgba(255,61,110,0.25)]'
                      }`}>
                        {trade.direction}
                      </span>
                    </span>
                    <span className={`text-right font-mono font-bold ${
                      trade.netPnl >= 0
                        ? isLight ? 'text-[#059669]' : 'text-[#00D6A3]'
                        : isLight ? 'text-[#DC2626]' : 'text-[#FF3D6E]'
                    }`}>
                      {formatCurrency(trade.netPnl)}
                    </span>
                  </div>
                ))}

                {(activeTab === 'recent' ? closedTrades : openTrades).length === 0 && (
                  <div className={`text-center py-8 text-xs ${
                    isLight ? 'text-[#9CA3AF]' : 'text-[#5F6B80]'
                  }`}>
                    {activeTab === 'recent' ? 'No closed trades recorded' : 'No open positions running'}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Footer Action */}
            <div className={`pt-3 border-t mt-3 flex items-center justify-between text-xs ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                className={`font-semibold flex items-center gap-1.5 transition ${
                  isLight ? 'text-[#1D4ED8] hover:text-[#1E40AF]' : 'text-[#4C7DFF] hover:text-[#7096FF]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Log new trade
              </button>
              <button
                onClick={() => setActiveView('trades')}
                className={`transition font-medium ${
                  isLight ? 'text-[#4B5563] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'
                }`}
              >
                View all trades →
              </button>
            </div>
          </div>
        )}

        {/* 3. Account Balance / Equity Curve */}
        {widgets.accountBalance && (
          <div className={`rounded-xl border p-4 flex flex-col justify-between transition min-w-0 overflow-hidden ${
            isLight
              ? 'border-[#E5E7EB] bg-white shadow-xs'
              : 'border-[#20283A] bg-[#0D111B]'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                Portfolio Balance Curve <DashboardInfoTooltip info={METRIC_INFOS.accountBalance} />
              </span>
            </div>
            <AccountBalanceChart
              trades={closedTrades}
              account={selectedAccount}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>

      {/* Additive Feature Section: Performance Calendar & Trade Time Analytics */}
      {(widgets.calendar || widgets.drawdown || widgets.tradeTimePerformance) && (
        <div className={`pt-5 border-t ${isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'}`}>
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-[#2563FF]" />
              <h2 className={`text-sm font-semibold ${isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'}`}>
                Monthly Performance & Execution Analytics
              </h2>
            </div>
            <button
              onClick={() => setDashboardMode('calendar')}
              className={`text-xs font-semibold transition ${
                isLight ? 'text-[#2563FF] hover:text-[#1D4ED8]' : 'text-[#4C7DFF] hover:text-[#7096FF]'
              }`}
            >
              Expand to full calendar view →
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Left: Monthly Trading Calendar (8 cols on xl) */}
            {widgets.calendar && (
              <div className="xl:col-span-8">
                <PerformanceCalendar
                  trades={closedTrades}
                  formatCurrency={formatCurrency}
                  formatRMultiple={formatRMultiple}
                  onSelectTrade={onSelectTrade}
                />
              </div>
            )}

            {/* Right: Drawdown Curve & Trade Time Performance (4 cols on xl) */}
            <div className="xl:col-span-4 space-y-5">
              {widgets.drawdown && (
                <DrawdownChart
                  trades={closedTrades}
                  formatCurrency={formatCurrency}
                />
              )}
              {widgets.tradeTimePerformance && (
                <TradeTimePerformanceChart
                  trades={closedTrades}
                  formatCurrency={formatCurrency}
                  onSelectTrade={onSelectTrade}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}

      {/* Customize Dashboard Widgets Modal */}
      {isEditWidgetsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditWidgetsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-[#E5E7EB] text-[#111827]'
                : 'bg-[#0D111B] border-[#28344A] text-[#F3F6FB]'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E5E7EB]' : 'border-[#20283A]'
            }`}>
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
              }`}>
                <SlidersHorizontal className={`w-4 h-4 ${isLight ? 'text-[#1D4ED8]' : 'text-[#4C7DFF]'}`} />
                Customize Dashboard Widgets
              </h3>
              <button
                onClick={() => setIsEditWidgetsOpen(false)}
                className={`text-xs transition ${
                  isLight ? 'text-[#6B7280] hover:text-[#111827]' : 'text-[#8C97AB] hover:text-[#F3F6FB]'
                }`}
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
              {[
                { key: 'calendar', label: 'Trading Calendar (Monthly Net P&L & Weekly Summaries)' },
                { key: 'drawdown', label: 'Drawdown Underwater Curve' },
                { key: 'tradeTimePerformance', label: 'Trade Time Performance Scatter Plot' },
                { key: 'kpis', label: 'Top KPI Cards (Net P&L, Win %, PF, Day Win %, Avg Win/Loss)' },
                { key: 'scoreCard', label: 'TradeForge Score Radar Card' },
                { key: 'progressTracker', label: 'Progress Tracker & Activity Heatmap' },
                { key: 'cumulativeChart', label: 'Daily Net Cumulative Equity Curve' },
                { key: 'dailyBarChart', label: 'Net Daily P&L Distribution Bar Chart' },
                { key: 'positionsTable', label: 'Recent Trades & Open Positions Widget' },
                { key: 'accountBalance', label: 'Account Balance & Equity Curve' },
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition ${
                    isLight
                      ? 'bg-[#F8FAFC] border-[#E5E7EB] hover:border-[#CBD5E1]'
                      : 'bg-[#0A0E16] border-[#20283A] hover:border-[#28344A]'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    isLight ? 'text-[#111827]' : 'text-[#F3F6FB]'
                  }`}>
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={(widgets as any)[item.key]}
                    onChange={e =>
                      setWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="rounded text-[#2563FF] focus:ring-[#2563FF] h-4 w-4 border-[#28344A] bg-[#111722]"
                  />
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsEditWidgetsOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563FF] hover:bg-[#2F6BFF] text-white transition active:scale-[0.98]"
              >
                Save Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
