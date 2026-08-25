import React, { useMemo } from 'react';
import {
  X,
  Award,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Activity,
  Flame,
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ReplayTrade, DemoAccount, SessionMetrics, BacktestSessionSettings } from '../types';

interface SessionScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  account: DemoAccount;
  trades: ReplayTrade[];
  settings?: BacktestSessionSettings;
  formatCurrency: (val: number) => string;
}

export const SessionScorecardModal: React.FC<SessionScorecardModalProps> = ({
  isOpen,
  onClose,
  sessionName,
  symbol,
  timeframe,
  startDate,
  account,
  trades,
  settings,
  formatCurrency,
}) => {
  if (!isOpen) return null;

  // Compute session metrics
  const metrics = useMemo(() => {
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

    const setupMap: Record<string, { wins: number; total: number; pnl: number; totalR: number }> = {};

    trades.forEach(t => {
      totalR += t.rMultiple;
      totalDuration += t.durationCandles;

      const setup = t.strategySetup || 'Discretionary';
      if (!setupMap[setup]) {
        setupMap[setup] = { wins: 0, total: 0, pnl: 0, totalR: 0 };
      }
      setupMap[setup].total += 1;
      setupMap[setup].pnl += t.realizedPnl;
      setupMap[setup].totalR += t.rMultiple;

      if (t.realizedPnl > 0) {
        wins++;
        grossProfit += t.realizedPnl;
        setupMap[setup].wins += 1;
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
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const lossRate = trades.length > 0 ? (losses / trades.length) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const avgR = trades.length > 0 ? totalR / trades.length : 0;
    const expectancy = (winRate / 100) * avgWin - (lossRate / 100) * avgLoss;

    // Find Best & Worst Setup
    let bestSetupName = 'None';
    let bestSetupPnl = -Infinity;
    let worstSetupName = 'None';
    let worstSetupPnl = Infinity;

    Object.entries(setupMap).forEach(([setup, data]) => {
      if (data.pnl > bestSetupPnl) {
        bestSetupPnl = data.pnl;
        bestSetupName = setup;
      }
      if (data.pnl < worstSetupPnl) {
        worstSetupPnl = data.pnl;
        worstSetupName = setup;
      }
    });

    // Calculate Grade
    let score = 0;
    if (profitFactor >= 2.5) score += 35;
    else if (profitFactor >= 1.75) score += 25;
    else if (profitFactor >= 1.2) score += 15;
    else if (profitFactor >= 1.0) score += 5;

    if (winRate >= 60) score += 25;
    else if (winRate >= 50) score += 20;
    else if (winRate >= 40 && avgR >= 1.5) score += 20;
    else if (winRate >= 35) score += 10;

    if (account.maxDrawdownPercent <= 5) score += 25;
    else if (account.maxDrawdownPercent <= 10) score += 20;
    else if (account.maxDrawdownPercent <= 15) score += 10;
    else if (account.maxDrawdownPercent <= 25) score += 0;
    else score -= 15;

    if (avgR >= 1.5) score += 15;
    else if (avgR >= 1.0) score += 10;
    else if (avgR >= 0.5) score += 5;

    let grade = 'C';
    let gradeColor = 'text-amber-400';
    let gradeFeedback = 'Solid baseline execution with room to refine trade selection.';

    if (trades.length === 0) {
      grade = 'N/A';
      gradeColor = 'text-slate-400';
      gradeFeedback = 'No trades executed in this session yet.';
    } else if (score >= 85) {
      grade = 'A+';
      gradeColor = 'text-emerald-400';
      gradeFeedback = 'Elite execution: High profit factor, disciplined drawdown control, and strong edge.';
    } else if (score >= 70) {
      grade = 'A';
      gradeColor = 'text-emerald-400';
      gradeFeedback = 'Strong profitable strategy with positive expectancy and solid risk control.';
    } else if (score >= 50) {
      grade = 'B';
      gradeColor = 'text-indigo-400';
      gradeFeedback = 'Profitable session with moderate variance. Focus on cutting losers earlier.';
    } else if (score >= 35) {
      grade = 'C';
      gradeColor = 'text-amber-400';
      gradeFeedback = 'Break-even / borderline performance. Refine your setup criteria and R:R ratios.';
    } else {
      grade = 'D';
      gradeColor = 'text-rose-400';
      gradeFeedback = 'Negative expectancy or high drawdown. Review mistake tags and risk sizing rules.';
    }

    return {
      totalTrades: trades.length,
      winningTrades: wins,
      losingTrades: losses,
      breakevenTrades: bes,
      winRate,
      netPnl,
      grossProfit,
      grossLoss,
      profitFactor,
      avgWin,
      avgLoss,
      avgR,
      largestWin,
      largestLoss,
      maxDrawdownPercent: account.maxDrawdownPercent,
      maxDrawdownDollar: account.maxDrawdown,
      longestWinStreak: maxWinStreak,
      longestLossStreak: maxLossStreak,
      avgDurationCandles: trades.length > 0 ? Math.round(totalDuration / trades.length) : 0,
      expectancy,
      bestSetupName: trades.length > 0 ? bestSetupName : 'None',
      worstSetupName: trades.length > 0 ? worstSetupName : 'None',
      setupMap,
      grade,
      gradeColor,
      gradeFeedback,
    };
  }, [trades, account]);

  // Export session analytics CSV
  const exportAnalyticsCSV = () => {
    const lines = [
      'SESSION SCORECARD & PERFORMANCE ANALYTICS',
      `Session Name,${sessionName}`,
      `Symbol,${symbol}`,
      `Timeframe,${timeframe}`,
      `Start Date,${startDate}`,
      `Starting Balance,${account.startingBalance}`,
      `Ending Equity,${account.equity}`,
      `Net Profit / Loss,${metrics.netPnl}`,
      `Total Return (%),${account.totalReturnPercent.toFixed(2)}%`,
      `Total Trades,${metrics.totalTrades}`,
      `Winning Trades,${metrics.winningTrades}`,
      `Losing Trades,${metrics.losingTrades}`,
      `Win Rate (%),${metrics.winRate.toFixed(2)}%`,
      `Profit Factor,${metrics.profitFactor.toFixed(2)}`,
      `Expectancy ($),${metrics.expectancy.toFixed(2)}`,
      `Average R-Multiple,${metrics.avgR.toFixed(2)}R`,
      `Max Drawdown (%),${metrics.maxDrawdownPercent.toFixed(2)}%`,
      `Max Drawdown ($),${metrics.maxDrawdownDollar.toFixed(2)}`,
      `Performance Grade,${metrics.grade}`,
      '',
      'SETUP / STRATEGY BREAKDOWN',
      'Setup Name,Trades,Win Rate (%),Net PnL ($),Avg R-Multiple',
      ...(Object.entries(metrics.setupMap) as [string, { wins: number; total: number; pnl: number; totalR: number }][]).map(([name, data]) => {
        const wr = data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : '0';
        const ar = data.total > 0 ? (data.totalR / data.total).toFixed(2) : '0';
        return `"${name}",${data.total},${wr}%,${data.pnl.toFixed(2)},${ar}R`;
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Session_Scorecard_${symbol}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export complete session summary JSON
  const exportSessionSummaryJSON = () => {
    const summary = {
      sessionName,
      symbol,
      timeframe,
      startDate,
      startingBalance: account.startingBalance,
      endingBalance: account.balance,
      endingEquity: account.equity,
      totalReturnPercent: account.totalReturnPercent,
      metrics,
      settings,
      tradesCount: trades.length,
      trades,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Session_Summary_${symbol}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Session Scorecard & Audit</h2>
              <p className="text-xs text-slate-400">
                {sessionName} • {symbol} {timeframe}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* Executive Performance Grade Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shadow-lg">
                <span className={`text-2xl font-black font-mono ${metrics.gradeColor}`}>{metrics.grade}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Grade</span>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-sm font-bold text-white">Overall Performance Rating</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {metrics.totalTrades} Trades Tested
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-md">{metrics.gradeFeedback}</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <button
                onClick={exportAnalyticsCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Scorecard CSV</span>
              </button>
              <button
                onClick={exportSessionSummaryJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Full Summary JSON</span>
              </button>
            </div>
          </div>

          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Net P&L (Return %)</div>
              <div
                className={`text-base font-black font-mono ${
                  metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.netPnl >= 0 ? '+' : ''}
                {formatCurrency(metrics.netPnl)}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {account.totalReturnPercent >= 0 ? '+' : ''}
                {account.totalReturnPercent.toFixed(2)}% ROI
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Win Rate & Count</div>
              <div className="text-base font-black font-mono text-white">
                {metrics.winRate.toFixed(1)}%
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {metrics.winningTrades}W / {metrics.losingTrades}L
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Profit Factor & Expectancy</div>
              <div className="text-base font-black font-mono text-indigo-400">
                {metrics.profitFactor.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Exp: {formatCurrency(metrics.expectancy)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Max Drawdown</div>
              <div className="text-base font-black font-mono text-rose-400">
                {metrics.maxDrawdownPercent.toFixed(2)}%
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Depth: {formatCurrency(metrics.maxDrawdownDollar)}
              </div>
            </div>
          </div>

          {/* Deep Execution Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-sans font-bold uppercase block">Average R</span>
              <span className="font-bold text-white mt-0.5 block">
                {metrics.avgR >= 0 ? '+' : ''}
                {metrics.avgR.toFixed(2)}R
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-sans font-bold uppercase block">Largest Win</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">
                +{formatCurrency(metrics.largestWin)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-sans font-bold uppercase block">Largest Loss</span>
              <span className="font-bold text-rose-400 mt-0.5 block">
                -{formatCurrency(metrics.largestLoss)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-sans font-bold uppercase block">Streaks (W / L)</span>
              <span className="font-bold text-slate-300 mt-0.5 block">
                {metrics.longestWinStreak}W / {metrics.longestLossStreak}L
              </span>
            </div>
          </div>

          {/* Setup / Strategy Attribution Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Strategy Setup Performance Attribution</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                Best: <strong className="text-emerald-400">{metrics.bestSetupName}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50 text-[11px]">
                    <th className="py-2.5 px-3">Setup / Strategy</th>
                    <th className="py-2.5 px-3">Trades</th>
                    <th className="py-2.5 px-3">Win Rate</th>
                    <th className="py-2.5 px-3">Avg R</th>
                    <th className="py-2.5 px-3 text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(Object.entries(metrics.setupMap) as [string, { wins: number; total: number; pnl: number; totalR: number }][]).map(([setup, data]) => {
                    const wr = data.total > 0 ? (data.wins / data.total) * 100 : 0;
                    const ar = data.total > 0 ? data.totalR / data.total : 0;
                    return (
                      <tr key={setup} className="hover:bg-slate-900/40 transition">
                        <td className="py-2 px-3 font-bold text-white">{setup}</td>
                        <td className="py-2 px-3 text-slate-300">{data.total}</td>
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
