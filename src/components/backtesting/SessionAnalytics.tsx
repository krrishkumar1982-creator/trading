import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  Award,
  ShieldAlert,
  Flame,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Layers,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Tag,
  Star,
} from 'lucide-react';
import { ReplayTrade, DemoAccount, SessionMetrics } from './types';

interface SessionAnalyticsProps {
  trades: ReplayTrade[];
  account: DemoAccount;
  formatCurrency: (val: number) => string;
}

type CurveType = 'EQUITY' | 'BALANCE' | 'DRAWDOWN';
type BreakdownTab = 'SETUP' | 'DIRECTION' | 'SESSION' | 'DAY_OF_WEEK' | 'MISTAKES';

export const SessionAnalytics: React.FC<SessionAnalyticsProps> = ({
  trades,
  account,
  formatCurrency,
}) => {
  const [activeCurve, setActiveCurve] = useState<CurveType>('EQUITY');
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<BreakdownTab>('SETUP');

  // Compute session metrics dynamically from trade log
  const metrics: SessionMetrics = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        lossRate: 0,
        netPnl: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        winLossRatio: 0,
        avgR: 0,
        largestWin: 0,
        largestLoss: 0,
        maxDrawdownDollar: 0,
        maxDrawdownPercent: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        avgDurationMinutes: 0,
        expectancy: 0,
      };
    }

    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let bes = 0;
    let totalR = 0;
    let largestWin = 0;
    let largestLoss = 0;
    let totalDuration = 0;

    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    trades.forEach(t => {
      totalR += t.rMultiple;
      totalDuration += t.durationCandles;

      if (t.realizedPnl > 0) {
        wins++;
        grossProfit += t.realizedPnl;
        if (t.realizedPnl > largestWin) largestWin = t.realizedPnl;
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (t.realizedPnl < 0) {
        losses++;
        const lossAbs = Math.abs(t.realizedPnl);
        grossLoss += lossAbs;
        if (lossAbs > largestLoss) largestLoss = lossAbs;
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      } else {
        bes++;
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    });

    const netPnl = grossProfit - grossLoss;
    const winRate = (wins / trades.length) * 100;
    const lossRate = (losses / trades.length) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 1 : 0;
    const avgR = totalR / trades.length;
    const expectancy = (winRate / 100) * avgWin - (lossRate / 100) * avgLoss;

    return {
      totalTrades: trades.length,
      winningTrades: wins,
      losingTrades: losses,
      breakevenTrades: bes,
      winRate,
      lossRate,
      netPnl,
      grossProfit,
      grossLoss,
      profitFactor,
      avgWin,
      avgLoss,
      winLossRatio,
      avgR,
      largestWin,
      largestLoss,
      maxDrawdownDollar: account.maxDrawdown,
      maxDrawdownPercent: account.maxDrawdownPercent,
      longestWinStreak: maxWinStreak,
      longestLossStreak: maxLossStreak,
      avgDurationMinutes: Math.round(totalDuration / trades.length),
      expectancy,
    };
  }, [trades, account]);

  // Generate Equity, Balance, and Drawdown curve points
  const curvePoints = useMemo(() => {
    let runningBalance = account.startingBalance;
    let peak = runningBalance;

    const points = [
      {
        index: 0,
        balance: runningBalance,
        equity: runningBalance,
        drawdown: 0,
        drawdownPct: 0,
        label: 'Start',
      },
    ];

    trades.forEach((t, i) => {
      runningBalance += t.realizedPnl;
      if (runningBalance > peak) peak = runningBalance;
      const dd = peak - runningBalance;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;

      points.push({
        index: i + 1,
        balance: runningBalance,
        equity: runningBalance, // in backtest historical closed trades, equity coincides at close
        drawdown: dd,
        drawdownPct: ddPct,
        label: `Trade #${i + 1}`,
      });
    });

    return points;
  }, [trades, account.startingBalance]);

  // SVG Chart rendering
  const svgWidth = 640;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const currentValues = useMemo(() => {
    if (activeCurve === 'DRAWDOWN') {
      return curvePoints.map(p => p.drawdownPct);
    }
    return curvePoints.map(p => p.balance);
  }, [curvePoints, activeCurve]);

  const minVal = useMemo(() => {
    if (activeCurve === 'DRAWDOWN') return 0;
    return Math.min(...currentValues, account.startingBalance * 0.95);
  }, [activeCurve, currentValues, account.startingBalance]);

  const maxVal = useMemo(() => {
    if (activeCurve === 'DRAWDOWN') {
      return Math.max(10, Math.max(...currentValues) * 1.2);
    }
    return Math.max(...currentValues, account.startingBalance * 1.05);
  }, [activeCurve, currentValues, account.startingBalance]);

  const range = maxVal - minVal || 1;

  const getX = (idx: number) =>
    paddingX + (idx / Math.max(1, curvePoints.length - 1)) * (svgWidth - 2 * paddingX);

  const getY = (val: number) => {
    if (activeCurve === 'DRAWDOWN') {
      // Inverted for drawdown so 0% is at top and deep drawdown goes down
      return paddingY + (val / range) * (svgHeight - 2 * paddingY);
    }
    return svgHeight - paddingY - ((val - minVal) / range) * (svgHeight - 2 * paddingY);
  };

  const pathD = curvePoints
    .map((pt, i) => {
      const val = activeCurve === 'DRAWDOWN' ? pt.drawdownPct : pt.balance;
      return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
    })
    .join(' ');

  const areaD =
    activeCurve === 'DRAWDOWN'
      ? `${pathD} L ${getX(curvePoints.length - 1)} ${paddingY} L ${getX(0)} ${paddingY} Z`
      : `${pathD} L ${getX(curvePoints.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${
          svgHeight - paddingY
        } Z`;

  const isPositive = metrics.netPnl >= 0;
  const strokeColor =
    activeCurve === 'DRAWDOWN' ? '#f43f5e' : isPositive ? '#10b981' : '#ef4444';

  // -------------------------------------------------------------
  // BREAKDOWN CALCULATIONS (By Setup, Direction, Session, Day, Mistakes)
  // -------------------------------------------------------------
  const breakdownData = useMemo(() => {
    const setups: Record<string, { trades: number; wins: number; pnl: number; r: number }> = {};
    const directions: Record<string, { trades: number; wins: number; pnl: number; r: number }> = {
      BUY: { trades: 0, wins: 0, pnl: 0, r: 0 },
      SELL: { trades: 0, wins: 0, pnl: 0, r: 0 },
    };
    const sessions: Record<string, { trades: number; wins: number; pnl: number; r: number }> = {};
    const days: Record<string, { trades: number; wins: number; pnl: number; r: number }> = {
      Monday: { trades: 0, wins: 0, pnl: 0, r: 0 },
      Tuesday: { trades: 0, wins: 0, pnl: 0, r: 0 },
      Wednesday: { trades: 0, wins: 0, pnl: 0, r: 0 },
      Thursday: { trades: 0, wins: 0, pnl: 0, r: 0 },
      Friday: { trades: 0, wins: 0, pnl: 0, r: 0 },
    };
    const mistakes: Record<string, { count: number; lostPnl: number }> = {};

    let totalDiscipline = 0;

    trades.forEach(t => {
      // Setup
      const sName = t.strategySetup || 'Discretionary';
      if (!setups[sName]) setups[sName] = { trades: 0, wins: 0, pnl: 0, r: 0 };
      setups[sName].trades++;
      setups[sName].pnl += t.realizedPnl;
      setups[sName].r += t.rMultiple;
      if (t.realizedPnl > 0) setups[sName].wins++;

      // Direction
      if (directions[t.direction]) {
        directions[t.direction].trades++;
        directions[t.direction].pnl += t.realizedPnl;
        directions[t.direction].r += t.rMultiple;
        if (t.realizedPnl > 0) directions[t.direction].wins++;
      }

      // Session
      const sessName = t.sessionTag || 'New York';
      if (!sessions[sessName]) sessions[sessName] = { trades: 0, wins: 0, pnl: 0, r: 0 };
      sessions[sessName].trades++;
      sessions[sessName].pnl += t.realizedPnl;
      sessions[sessName].r += t.rMultiple;
      if (t.realizedPnl > 0) sessions[sessName].wins++;

      // Day of week
      const date = new Date(t.openTime * 1000);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[date.getDay()] || 'Monday';
      if (days[dayName]) {
        days[dayName].trades++;
        days[dayName].pnl += t.realizedPnl;
        days[dayName].r += t.rMultiple;
        if (t.realizedPnl > 0) days[dayName].wins++;
      }

      // Mistakes
      const mTag = t.mistakeTag || 'None';
      if (!mistakes[mTag]) mistakes[mTag] = { count: 0, lostPnl: 0 };
      mistakes[mTag].count++;
      if (t.realizedPnl < 0) mistakes[mTag].lostPnl += Math.abs(t.realizedPnl);

      totalDiscipline += t.disciplineRating || 5;
    });

    const avgDiscipline = trades.length > 0 ? totalDiscipline / trades.length : 5;

    return {
      setups,
      directions,
      sessions,
      days,
      mistakes,
      avgDiscipline,
    };
  }, [trades]);

  return (
    <div className="space-y-4">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Net P&L */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Session Net P&L</span>
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div
            className={`text-lg font-black font-mono tracking-tight ${
              metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {metrics.netPnl >= 0 ? '+' : ''}
            {formatCurrency(metrics.netPnl)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Return: {account.totalReturnPercent >= 0 ? '+' : ''}
            {account.totalReturnPercent.toFixed(2)}%
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Win Rate</span>
            <Target className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-white">
            {metrics.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {metrics.winningTrades}W / {metrics.losingTrades}L ({metrics.totalTrades} total)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Profit Factor</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-white">
            {metrics.profitFactor.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Gross +{formatCurrency(metrics.grossProfit)} / -{formatCurrency(metrics.grossLoss)}
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Max Drawdown</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight text-rose-400">
            {metrics.maxDrawdownPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Depth: {formatCurrency(metrics.maxDrawdownDollar)}
          </div>
        </div>
      </div>

      {/* Interactive Equity, Balance & Drawdown Curves */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>Interactive Performance Curves</span>
          </div>

          {/* Curve Type Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setActiveCurve('EQUITY')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeCurve === 'EQUITY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Equity Curve
            </button>
            <button
              onClick={() => setActiveCurve('BALANCE')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeCurve === 'BALANCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Balance Curve
            </button>
            <button
              onClick={() => setActiveCurve('DRAWDOWN')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeCurve === 'DRAWDOWN' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drawdown Curve (%)
            </button>
          </div>
        </div>

        <div className="relative w-full h-[160px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
            <defs>
              <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Baseline starting balance */}
            {activeCurve !== 'DRAWDOWN' ? (
              <line
                x1={paddingX}
                y1={getY(account.startingBalance)}
                x2={svgWidth - paddingX}
                y2={getY(account.startingBalance)}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ) : (
              <line
                x1={paddingX}
                y1={paddingY}
                x2={svgWidth - paddingX}
                y2={paddingY}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Filled Area */}
            <path d={areaD} fill="url(#analyticsGradient)" />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {curvePoints.map((pt, i) => {
              const val = activeCurve === 'DRAWDOWN' ? pt.drawdownPct : pt.balance;
              return (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(val)}
                  r={i === curvePoints.length - 1 ? 4 : 2.5}
                  fill={strokeColor}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Deep Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Win</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
            +{formatCurrency(metrics.avgWin)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Loss</div>
          <div className="text-xs font-mono font-bold text-rose-400 mt-0.5">
            -{formatCurrency(metrics.avgLoss)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Average R</div>
          <div className="text-xs font-mono font-bold text-white mt-0.5">
            {metrics.avgR >= 0 ? '+' : ''}
            {metrics.avgR.toFixed(2)}R
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Win Streak</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {metrics.longestWinStreak} Wins
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Expectancy</div>
          <div className="text-xs font-mono font-bold text-indigo-400 mt-0.5">
            {formatCurrency(metrics.expectancy)}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Avg Duration</div>
          <div className="text-xs font-mono font-bold text-slate-300 mt-0.5">
            {metrics.avgDurationMinutes} bars
          </div>
        </div>
      </div>

      {/* Advanced Tagging & Setup Breakdown Tabs */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2 font-bold text-xs text-white">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Setup & Context Analytics</span>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-semibold">
            {(['SETUP', 'DIRECTION', 'SESSION', 'DAY_OF_WEEK', 'MISTAKES'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveBreakdownTab(tab)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  activeBreakdownTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'SETUP'
                  ? 'By Setup'
                  : tab === 'DIRECTION'
                  ? 'Direction'
                  : tab === 'SESSION'
                  ? 'Session'
                  : tab === 'DAY_OF_WEEK'
                  ? 'Day of Week'
                  : 'Mistakes'}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Content */}
        {activeBreakdownTab === 'SETUP' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Setup / Strategy</th>
                  <th className="py-2 px-3">Trades</th>
                  <th className="py-2 px-3">Win Rate</th>
                  <th className="py-2 px-3">Avg R</th>
                  <th className="py-2 px-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Object.keys(breakdownData.setups).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                      No trades recorded yet.
                    </td>
                  </tr>
                ) : (
                  (Object.entries(breakdownData.setups) as [string, { trades: number; wins: number; pnl: number; r: number }][]).map(([name, data]) => {
                    const wr = data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
                    const ar = data.trades > 0 ? data.r / data.trades : 0;
                    return (
                      <tr key={name} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-white">{name}</td>
                        <td className="py-2 px-3 text-slate-300">{data.trades}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              wr >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {wr.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {ar >= 0 ? '+' : ''}
                          {ar.toFixed(2)}R
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {data.pnl >= 0 ? '+' : ''}
                          {formatCurrency(data.pnl)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeBreakdownTab === 'DIRECTION' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['BUY', 'SELL'] as const).map(dir => {
              const d = breakdownData.directions[dir];
              const wr = d.trades > 0 ? (d.wins / d.trades) * 100 : 0;
              const ar = d.trades > 0 ? d.r / d.trades : 0;
              return (
                <div key={dir} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                        dir === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {dir === 'BUY' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {dir === 'BUY' ? 'Long Trades' : 'Short Trades'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{d.trades} Trades</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Win Rate</span>
                      <span className="font-bold text-white">{wr.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Avg R</span>
                      <span className="font-bold text-white">
                        {ar >= 0 ? '+' : ''}
                        {ar.toFixed(2)}R
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Net P&L</span>
                      <span className={`font-bold ${d.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {d.pnl >= 0 ? '+' : ''}
                        {formatCurrency(d.pnl)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeBreakdownTab === 'SESSION' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Trading Session</th>
                  <th className="py-2 px-3">Trades</th>
                  <th className="py-2 px-3">Win Rate</th>
                  <th className="py-2 px-3">Avg R</th>
                  <th className="py-2 px-3 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Object.keys(breakdownData.sessions).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                      No trades recorded yet.
                    </td>
                  </tr>
                ) : (
                  (Object.entries(breakdownData.sessions) as [string, { trades: number; wins: number; pnl: number; r: number }][]).map(([name, data]) => {
                    const wr = data.trades > 0 ? (data.wins / data.trades) * 100 : 0;
                    const ar = data.trades > 0 ? data.r / data.trades : 0;
                    return (
                      <tr key={name} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 font-bold text-white">{name}</td>
                        <td className="py-2 px-3 text-slate-300">{data.trades}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              wr >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {wr.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {ar >= 0 ? '+' : ''}
                          {ar.toFixed(2)}R
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            data.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {data.pnl >= 0 ? '+' : ''}
                          {formatCurrency(data.pnl)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeBreakdownTab === 'DAY_OF_WEEK' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {(Object.entries(breakdownData.days) as [string, { trades: number; wins: number; pnl: number; r: number }][]).map(([day, d]) => {
              const wr = d.trades > 0 ? (d.wins / d.trades) * 100 : 0;
              return (
                <div key={day} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-white text-[11px]">{day}</div>
                  <div className="text-[10px] text-slate-400">{d.trades} trades ({wr.toFixed(0)}% WR)</div>
                  <div className={`font-bold ${d.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {d.pnl >= 0 ? '+' : ''}
                    {formatCurrency(d.pnl)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeBreakdownTab === 'MISTAKES' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Execution Discipline Average:</span>
              <span className="font-bold font-mono text-amber-400">
                {breakdownData.avgDiscipline.toFixed(1)} / 5.0 Stars
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {(Object.entries(breakdownData.mistakes) as [string, { count: number; lostPnl: number }][]).map(([tag, data]) => (
                <div
                  key={tag}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white">{tag}</div>
                    <div className="text-[10px] text-slate-400">{data.count} occurrence(s)</div>
                  </div>
                  {data.lostPnl > 0 && (
                    <div className="text-right text-rose-400 font-bold">
                      -{formatCurrency(data.lostPnl)} lost
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
