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

  // Real Trade Metrics Calculation
  const metrics = useMemo(() => {
    const totalNetPnl = closedTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const winTrades = closedTrades.filter(t => t.netPnl > 0);
    const lossTrades = closedTrades.filter(t => t.netPnl < 0);
    const beTrades = closedTrades.filter(t => t.netPnl === 0);

    const totalTradesCount = closedTrades.length;
    const tradeWinRate = totalTradesCount > 0 ? (winTrades.length / totalTradesCount) * 100 : 0;

    const grossProfit = winTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLoss = Math.abs(lossTrades.reduce((acc, t) => acc + t.netPnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5.0 : 0;

    const avgWin = winTrades.length ? grossProfit / winTrades.length : 0;
    const avgLoss = lossTrades.length ? grossLoss / lossTrades.length : 0;
    const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

    // Day Win Rate Calculation (from unique trading days)
    const dayMap: { [dateStr: string]: number } = {};
    closedTrades.forEach(t => {
      if (!t.entryDate) return;
      const d = t.entryDate.split('T')[0];
      dayMap[d] = (dayMap[d] || 0) + t.netPnl;
    });

    const dayPnlList = Object.values(dayMap);
    const winDays = dayPnlList.filter(pnl => pnl > 0).length;
    const lossDays = dayPnlList.filter(pnl => pnl < 0).length;
    const beDays = dayPnlList.filter(pnl => pnl === 0).length;
    const totalDays = dayPnlList.length;
    const dayWinRate = totalDays > 0 ? (winDays / totalDays) * 100 : 0;

    const startingCap = selectedAccount?.initialBalance || 50000;
    const accountGrowthPercent = (totalNetPnl / startingCap) * 100;

    return {
      totalNetPnl,
      winTradesCount: winTrades.length,
      lossTradesCount: lossTrades.length,
      beTradesCount: beTrades.length,
      totalTradesCount,
      tradeWinRate,
      grossProfit,
      grossLoss,
      profitFactor,
      avgWin,
      avgLoss,
      avgWinLossRatio,
      winDays,
      lossDays,
      beDays,
      totalDays,
      dayWinRate,
      accountGrowthPercent,
    };
  }, [closedTrades, selectedAccount]);

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 max-w-[1520px] mx-auto">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
            isLight ? 'text-zinc-900' : 'text-zinc-100'
          }`}>
            Dashboard
          </h1>
          <p className={`text-xs mt-0.5 flex items-center gap-2 ${
            isLight ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            <span>Real-time trading performance & execution analytics</span>
            <span className={isLight ? 'text-zinc-300' : 'text-zinc-600'}>•</span>
            <span className={`font-mono ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {closedTrades.length} closed trades recorded
            </span>
          </p>
        </div>

        {/* Dashboard View Mode Tabs + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`flex items-center gap-1 p-1 rounded-xl border transition ${
            isLight
              ? 'bg-zinc-100 border-zinc-200'
              : 'bg-zinc-900 border-zinc-800'
          }`}>
            <button
              onClick={() => setDashboardMode('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dashboardMode === 'overview'
                  ? isLight
                    ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                    : 'bg-blue-600 text-white shadow-xs'
                  : isLight
                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Executive Overview</span>
            </button>
            <button
              onClick={() => setDashboardMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dashboardMode === 'calendar'
                  ? isLight
                    ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                    : 'bg-blue-600 text-white shadow-xs'
                  : isLight
                    ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Trading Calendar</span>
            </button>
          </div>

          <button
            onClick={() => setIsEditWidgetsOpen(true)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <SlidersHorizontal className={`w-3.5 h-3.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <span>Customize</span>
          </button>
          <button
            onClick={onOpenImport}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
              isLight
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Trades</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Trading Calendar & Execution Time Analytics Focused View */}
      {dashboardMode === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start animate-in fade-in">
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
          <div className="xl:col-span-4 space-y-4">
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
        <div className="space-y-4 animate-in fade-in">

      {/* Top 5 KPI Cards Row */}
      {widgets.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Net P&L Card */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:border-zinc-300'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}>
                Net P&L <DashboardInfoTooltip info={METRIC_INFOS.netPnl} />
              </span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${
                isLight
                  ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
              }`}>
                {metrics.totalTradesCount}
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                metrics.totalNetPnl >= 0
                  ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                  : isLight ? 'text-rose-600' : 'text-rose-400'
              }`}>
                {formatCurrency(metrics.totalNetPnl)}
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isLight
                  ? 'bg-blue-50 border border-blue-200 text-blue-600'
                  : 'bg-indigo-950/60 border border-indigo-800/40 text-indigo-400'
              }`}>
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-[10px] flex items-center justify-between font-mono pt-1 ${
              isLight ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span>Growth</span>
              <span className={
                metrics.accountGrowthPercent >= 0
                  ? isLight ? 'text-emerald-600 font-semibold' : 'text-emerald-400 font-semibold'
                  : isLight ? 'text-rose-600 font-semibold' : 'text-rose-400 font-semibold'
              }>
                {metrics.accountGrowthPercent >= 0 ? '+' : ''}{metrics.accountGrowthPercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* 2. Trade Win % Card */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:border-zinc-300'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}>
                Trade win % <DashboardInfoTooltip info={METRIC_INFOS.tradeWinRate} />
              </span>
            </div>
            <div className="flex items-center justify-between my-1.5">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                {metrics.tradeWinRate.toFixed(2)}%
              </div>
              <MultiSegmentSemicircleGauge
                wins={metrics.winTradesCount}
                breakevens={metrics.beTradesCount}
                losses={metrics.lossTradesCount}
                size={70}
                strokeWidth={6.5}
              />
            </div>
            {/* Pill breakdown underneath gauge */}
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono pt-0.5">
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                }`}
                title="Winning Trades"
              >
                {metrics.winTradesCount}
              </span>
              {metrics.beTradesCount > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}
                  title="Break-even Trades"
                >
                  {metrics.beTradesCount}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  isLight
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
                title="Losing Trades"
              >
                {metrics.lossTradesCount}
              </span>
            </div>
          </div>

          {/* 3. Profit Factor Card */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:border-zinc-300'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}>
                Profit factor <DashboardInfoTooltip info={METRIC_INFOS.profitFactor} />
              </span>
            </div>
            <div className="flex items-center justify-between my-1.5">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                {metrics.profitFactor.toFixed(2)}
              </div>
              <ProfitFactorDonut
                grossProfit={metrics.grossProfit}
                grossLoss={metrics.grossLoss}
                profitFactor={metrics.profitFactor}
                size={52}
                strokeWidth={6}
              />
            </div>
            {/* Gross profit and loss breakdown */}
            <div className={`text-[10px] flex items-center justify-between font-mono pt-1 ${
              isLight ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span>
                Wins:{' '}
                <strong className={isLight ? 'text-emerald-600 font-bold' : 'text-emerald-400 font-bold'}>
                  ${Math.round(metrics.grossProfit).toLocaleString()}
                </strong>
              </span>
              <span>
                Loss:{' '}
                <strong className={isLight ? 'text-rose-600 font-bold' : 'text-rose-400 font-bold'}>
                  -${Math.round(metrics.grossLoss).toLocaleString()}
                </strong>
              </span>
            </div>
          </div>

          {/* 4. Day Win % Card */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:border-zinc-300'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}>
                Day win % <DashboardInfoTooltip info={METRIC_INFOS.dayWinRate} />
              </span>
            </div>
            <div className="flex items-center justify-between my-1.5">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                {metrics.dayWinRate.toFixed(2)}%
              </div>
              <MultiSegmentSemicircleGauge
                wins={metrics.winDays}
                breakevens={metrics.beDays}
                losses={metrics.lossDays}
                size={70}
                strokeWidth={6.5}
              />
            </div>
            {/* Day counts pill breakdown */}
            <div className="flex items-center justify-end gap-2 text-[10px] font-mono pt-0.5">
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                }`}
                title="Green Days"
              >
                {metrics.winDays}
              </span>
              {metrics.beDays > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full font-bold ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}
                  title="Breakeven Days"
                >
                  {metrics.beDays}
                </span>
              )}
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  isLight
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
                title="Red Days"
              >
                {metrics.lossDays}
              </span>
            </div>
          </div>

          {/* 5. Avg Win / Loss Trade Card */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:border-zinc-300'
              : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium flex items-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}>
                Avg win/loss trade <DashboardInfoTooltip info={METRIC_INFOS.avgWinLoss} />
              </span>
            </div>
            <div className="flex items-center justify-between my-1.5">
              <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                {metrics.avgWinLossRatio.toFixed(2)}
              </div>
              {/* Dual horizontal ratio bar */}
              <div className="w-20 flex flex-col gap-1">
                <div className={`h-2 w-full rounded-full overflow-hidden flex ${
                  isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                }`}>
                  <div
                    className={`${isLight ? 'bg-emerald-500' : 'bg-emerald-400'} h-full transition-all`}
                    style={{ width: `${(metrics.avgWin / (metrics.avgWin + metrics.avgLoss || 1)) * 100}%` }}
                  />
                  <div
                    className={`${isLight ? 'bg-rose-500' : 'bg-rose-500'} h-full transition-all`}
                    style={{ width: `${(metrics.avgLoss / (metrics.avgWin + metrics.avgLoss || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <div className={`text-[10px] flex items-center justify-between font-mono pt-1 ${
              isLight ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span className={isLight ? 'text-emerald-600 font-semibold' : 'text-emerald-400 font-semibold'}>
                ${Math.round(metrics.avgWin).toLocaleString()}
              </span>
              <span className={isLight ? 'text-rose-600 font-semibold' : 'text-rose-400 font-semibold'}>
                -${Math.round(metrics.avgLoss).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row (3 Columns: DuskFlow Score, Progress Tracker, Cumulative P&L) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Card 1: DuskFlow Radar Score */}
        {widgets.scoreCard && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-zinc-900' : 'text-zinc-200'
              }`}>
                DuskFlow score <DashboardInfoTooltip info={METRIC_INFOS.duskFlowScore} />
              </span>
            </div>
            <RadarScoreCard trades={closedTrades} />
          </div>
        )}

        {/* Card 2: Progress Tracker Activity Heatmap */}
        {widgets.progressTracker && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-zinc-900' : 'text-zinc-200'
              }`}>
                Progress tracker <DashboardInfoTooltip info={METRIC_INFOS.progressTracker} />
              </span>
              <button
                onClick={() => setActiveView('calendar')}
                className={`text-[11px] font-semibold transition ${
                  isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                }`}
              >
                View more
              </button>
            </div>
            <ProgressTrackerCard trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}

        {/* Card 3: Daily Net Cumulative P&L */}
        {widgets.cumulativeChart && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-zinc-900' : 'text-zinc-200'
              }`}>
                Daily net cumulative P&L <DashboardInfoTooltip info={METRIC_INFOS.cumulativePnl} />
              </span>
              <span className={`text-xs font-mono font-bold ${
                metrics.totalNetPnl >= 0
                  ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                  : isLight ? 'text-rose-600' : 'text-rose-400'
              }`}>
                {formatCurrency(metrics.totalNetPnl)}
              </span>
            </div>
            <CumulativePnlChart trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}
      </div>

      {/* Bottom Row (3 Columns: Net Daily P&L, Recent Trades/Open Positions, Account Balance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* 1. Net Daily P&L */}
        {widgets.dailyBarChart && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-zinc-900' : 'text-zinc-200'
              }`}>
                Net daily P&L <DashboardInfoTooltip info={METRIC_INFOS.netDailyPnl} />
              </span>
            </div>
            <DailyPnlBarChart trades={closedTrades} formatCurrency={formatCurrency} />
          </div>
        )}

        {/* 2. Recent Trades / Open Positions Tabs */}
        {widgets.positionsTable && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div>
              {/* Tab Selector */}
              <div className={`flex items-center gap-4 border-b pb-2 mb-2 ${
                isLight ? 'border-zinc-200' : 'border-zinc-800'
              }`}>
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`text-xs font-bold pb-0.5 transition relative ${
                    activeTab === 'recent'
                      ? isLight ? 'text-blue-600' : 'text-blue-400'
                      : isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Recent trades
                  {activeTab === 'recent' && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full -mb-2 ${
                      isLight ? 'bg-blue-600' : 'bg-blue-500'
                    }`} />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('open')}
                  className={`text-xs font-bold pb-0.5 transition relative ${
                    activeTab === 'open'
                      ? isLight ? 'text-blue-600' : 'text-blue-400'
                      : isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Open positions ({openTrades.length})
                  {activeTab === 'open' && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full -mb-2 ${
                      isLight ? 'bg-blue-600' : 'bg-blue-500'
                    }`} />
                  )}
                </button>
              </div>

              {/* Table Header */}
              <div className={`grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg ${
                isLight ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-950/60 text-zinc-400'
              }`}>
                <span>Close Date</span>
                <span>Symbol</span>
                <span className="text-right">Net P&L</span>
              </div>

              {/* Table Rows */}
              <div className="space-y-1 mt-1.5 max-h-[170px] overflow-y-auto custom-scrollbar">
                {(activeTab === 'recent' ? closedTrades.slice(0, 5) : openTrades).map(trade => (
                  <div
                    key={trade.id}
                    onClick={() => onSelectTrade(trade)}
                    className={`grid grid-cols-3 items-center px-2.5 py-2 rounded-lg border cursor-pointer transition text-xs ${
                      isLight
                        ? 'bg-zinc-50 border-zinc-200/70 hover:border-blue-400 hover:bg-blue-50/40 text-zinc-900'
                        : 'bg-zinc-950/40 border-zinc-800/60 hover:border-blue-500/40 hover:bg-zinc-800/40 text-zinc-200'
                    }`}
                  >
                    <span className={`font-mono text-[11px] ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>
                      {trade.exitDate
                        ? new Date(trade.exitDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : trade.entryDate
                        ? new Date(trade.entryDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                        : 'Open'}
                    </span>
                    <span className={`font-semibold flex items-center gap-1.5 ${
                      isLight ? 'text-zinc-900' : 'text-zinc-200'
                    }`}>
                      {trade.symbol}
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        trade.direction === 'BUY'
                          ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400'
                          : isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {trade.direction}
                      </span>
                    </span>
                    <span className={`text-right font-mono font-bold ${
                      trade.netPnl >= 0
                        ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                        : isLight ? 'text-rose-600' : 'text-rose-400'
                    }`}>
                      {formatCurrency(trade.netPnl)}
                    </span>
                  </div>
                ))}

                {(activeTab === 'recent' ? closedTrades : openTrades).length === 0 && (
                  <div className={`text-center py-8 text-xs ${
                    isLight ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    {activeTab === 'recent' ? 'No closed trades recorded' : 'No open positions running'}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Footer Action */}
            <div className={`pt-2 border-t mt-2 flex items-center justify-between text-xs ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                className={`font-semibold flex items-center gap-1 transition ${
                  isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Log trade
              </button>
              <button
                onClick={() => setActiveView('trades')}
                className={`transition ${
                  isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                View all trades →
              </button>
            </div>
          </div>
        )}

        {/* 3. Account Balance / Equity Curve */}
        {widgets.accountBalance && (
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
            isLight
              ? 'border-zinc-200 bg-white'
              : 'border-zinc-800 bg-zinc-900'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                isLight ? 'text-zinc-900' : 'text-zinc-200'
              }`}>
                Account balance <DashboardInfoTooltip info={METRIC_INFOS.accountBalance} />
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
        <div className={`pt-3 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <h2 className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-200'}`}>
                Monthly Trading Performance & Execution Analytics
              </h2>
            </div>
            <button
              onClick={() => setDashboardMode('calendar')}
              className={`text-xs font-semibold transition ${
                isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              Expand to full calendar view →
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
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
            <div className="xl:col-span-4 space-y-4">
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
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditWidgetsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isLight
                ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}>
                <SlidersHorizontal className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                Customize Dashboard Widgets
              </h3>
              <button
                onClick={() => setIsEditWidgetsOpen(false)}
                className={`text-xs transition ${
                  isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
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
                { key: 'scoreCard', label: 'DuskFlow Score Radar Card' },
                { key: 'progressTracker', label: 'Progress Tracker & Activity Heatmap' },
                { key: 'cumulativeChart', label: 'Daily Net Cumulative Equity Curve' },
                { key: 'dailyBarChart', label: 'Net Daily P&L Distribution Bar Chart' },
                { key: 'positionsTable', label: 'Recent Trades & Open Positions Widget' },
                { key: 'accountBalance', label: 'Account Balance & Equity Curve' },
              ].map(item => (
                <label
                  key={item.key}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    isLight ? 'text-zinc-800' : 'text-zinc-200'
                  }`}>
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={(widgets as any)[item.key]}
                    onChange={e =>
                      setWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className={`rounded text-blue-600 focus:ring-blue-500 h-4 w-4 ${
                      isLight ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900'
                    }`}
                  />
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsEditWidgetsOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                }`}
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
