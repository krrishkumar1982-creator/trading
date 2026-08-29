import { Trade } from '../../types';
import {
  calculateComprehensiveMetrics,
  ComprehensiveMetrics,
  roundMoney
} from '../../lib/calcEngine';

export interface PerformanceMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage (decisive or all-trades)
  allTradesWinRate: number;
  lossRate: number; // percentage
  totalNetPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgTradePnl: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  largestWin: number;
  largestLoss: number;
  avgRMultiple: number;
  expectancy: number;
  totalCommissions: number;
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  currentDrawdownDollar: number;
  currentDrawdownPercent: number;
  avgDurationMinutes: number;
  bestTradingDay: { date: string; pnl: number };
  worstTradingDay: { date: string; pnl: number };
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  longestWinStreak: number;
  longestLossStreak: number;
  rulesFollowedRate: number;
}

export function calculatePerformanceMetrics(trades: Trade[], initialBalance = 50000): PerformanceMetrics {
  const m = calculateComprehensiveMetrics(trades, { initialBalance });
  const closed = trades.filter(t => t.status === 'CLOSED');

  // Duration
  const totalDuration = closed.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgDurationMinutes = closed.length > 0 ? Math.round(totalDuration / closed.length) : 0;

  // Best / Worst Day
  const dayPnlMap: { [date: string]: number } = {};
  closed.forEach(t => {
    const d = t.entryDate ? t.entryDate.split('T')[0] : 'N/A';
    dayPnlMap[d] = (dayPnlMap[d] || 0) + t.netPnl;
  });

  let bestDay = { date: 'N/A', pnl: 0 };
  let worstDay = { date: 'N/A', pnl: 0 };

  const dayEntries = Object.entries(dayPnlMap);
  if (dayEntries.length > 0) {
    const sortedDays = [...dayEntries].sort((a, b) => b[1] - a[1]);
    bestDay = { date: sortedDays[0][0], pnl: roundMoney(sortedDays[0][1], 2) };
    worstDay = { date: sortedDays[sortedDays.length - 1][0], pnl: roundMoney(sortedDays[sortedDays.length - 1][1], 2) };
  }

  const rulesFollowedCount = closed.filter(t => t.rulesFollowed).length;
  const rulesFollowedRate = closed.length > 0 ? Math.round((rulesFollowedCount / closed.length) * 100) : 0;

  return {
    totalTrades: m.totalTrades,
    closedTrades: m.closedTrades,
    openTrades: m.openTrades,
    winningTrades: m.winningTrades,
    losingTrades: m.losingTrades,
    breakevenTrades: m.breakevenTrades,
    winRate: m.winRate !== null ? m.winRate : m.allTradesWinRate,
    allTradesWinRate: m.allTradesWinRate,
    lossRate: m.lossRate !== null ? m.lossRate : 0,
    totalNetPnl: m.netPnl,
    grossProfit: m.grossProfit,
    grossLoss: m.grossLoss,
    profitFactor: m.profitFactor !== null && isFinite(m.profitFactor) ? m.profitFactor : (m.grossProfit > 0 ? 99.9 : 0),
    avgTradePnl: m.avgTradePnl,
    avgWin: m.avgWinningTrade,
    avgLoss: m.avgLosingTrade,
    winLossRatio: m.payoffRatio !== null && isFinite(m.payoffRatio) ? m.payoffRatio : (m.avgWinningTrade > 0 ? m.avgWinningTrade : 0),
    largestWin: m.largestWin,
    largestLoss: m.largestLoss,
    avgRMultiple: m.avgRMultiple !== null ? m.avgRMultiple : 0,
    expectancy: m.monetaryExpectancy,
    totalCommissions: m.totalCosts,
    maxDrawdownDollar: m.maxDrawdownDollars,
    maxDrawdownPercent: m.maxDrawdownPercent,
    currentDrawdownDollar: m.currentDrawdownDollars,
    currentDrawdownPercent: m.currentDrawdownPercent,
    avgDurationMinutes,
    bestTradingDay: bestDay,
    worstTradingDay: worstDay,
    currentStreak: m.currentStreak,
    longestWinStreak: m.maxConsecutiveWins,
    longestLossStreak: m.maxConsecutiveLosses,
    rulesFollowedRate,
  };
}

// --------------------------------------------------------------------------
// SMART KEY INSIGHTS GENERATOR (Algorithmic Edge Analysis)
// --------------------------------------------------------------------------
export interface SmartInsight {
  id: string;
  category: 'SESSION' | 'DISCIPLINE' | 'DAY_TIME' | 'INSTRUMENT' | 'DIRECTION' | 'RISK_REWARD' | 'DURATION';
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'WARNING';
  title: string;
  description: string;
  metricBadge: string;
}

export function generateSmartInsights(trades: Trade[]): SmartInsight[] {
  const closed = trades.filter(t => t.status === 'CLOSED');
  if (closed.length < 3) {
    return [
      {
        id: 'ins-empty',
        category: 'SESSION',
        type: 'NEUTRAL',
        title: 'Gathering Sample Size',
        description: 'Log at least 5 completed executions to unlock automated deep pattern recognition and statistical leak detection.',
        metricBadge: `${closed.length}/5 Trades`,
      },
    ];
  }

  const insights: SmartInsight[] = [];

  // 1. Session Breakdown Insight
  const sessions = ['New York', 'London', 'Asian', 'Overlap', 'Pre-Market'] as const;
  const sessionData = sessions.map(s => {
    const sTrades = closed.filter(t => t.session === s);
    const pnl = sTrades.reduce((a, b) => a + b.netPnl, 0);
    const wins = sTrades.filter(t => t.netPnl > 0).length;
    const wr = sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0;
    return { session: s, count: sTrades.length, pnl, wr };
  }).filter(s => s.count >= 2);

  if (sessionData.length > 0) {
    const bestSession = [...sessionData].sort((a, b) => b.pnl - a.pnl)[0];
    const worstSession = [...sessionData].sort((a, b) => a.pnl - b.pnl)[0];

    if (bestSession && bestSession.pnl > 0) {
      insights.push({
        id: 'ins-best-session',
        category: 'SESSION',
        type: 'POSITIVE',
        title: `Prime Alpha in ${bestSession.session} Session`,
        description: `Your highest profitability occurs during the ${bestSession.session} session with a ${bestSession.wr.toFixed(0)}% win rate and $${roundMoney(bestSession.pnl).toLocaleString()} total net P&L across ${bestSession.count} trades.`,
        metricBadge: `+$${Math.round(bestSession.pnl).toLocaleString()}`,
      });
    }

    if (worstSession && worstSession.pnl < 0 && worstSession.session !== bestSession?.session) {
      insights.push({
        id: 'ins-worst-session',
        category: 'SESSION',
        type: 'WARNING',
        title: `Liquidity Leak in ${worstSession.session} Session`,
        description: `Executions during ${worstSession.session} show negative expectancy (-$${Math.abs(Math.round(worstSession.pnl)).toLocaleString()}). Consider restricting risk or reviewing setups during this session.`,
        metricBadge: `-$${Math.abs(Math.round(worstSession.pnl)).toLocaleString()}`,
      });
    }
  }

  // 2. Rules Compliance vs Emotional/Rule Breaking
  const rulesFollowed = closed.filter(t => t.rulesFollowed);
  const rulesBroken = closed.filter(t => !t.rulesFollowed);

  if (rulesFollowed.length > 0 && rulesBroken.length > 0) {
    const pnlFollowed = rulesFollowed.reduce((a, b) => a + b.netPnl, 0);
    const pnlBroken = rulesBroken.reduce((a, b) => a + b.netPnl, 0);
    const wrFollowed = (rulesFollowed.filter(t => t.netPnl > 0).length / rulesFollowed.length) * 100;
    const wrBroken = (rulesBroken.filter(t => t.netPnl > 0).length / rulesBroken.length) * 100;

    const diffWR = Math.round(wrFollowed - wrBroken);
    insights.push({
      id: 'ins-rules-edge',
      category: 'DISCIPLINE',
      type: pnlFollowed > pnlBroken ? 'POSITIVE' : 'WARNING',
      title: 'Discipline Multiplier Effect',
      description: `When strictly adhering to trading rules, your win rate is ${wrFollowed.toFixed(0)}% vs ${wrBroken.toFixed(0)}% when rules are broken (${diffWR >= 0 ? `+${diffWR}% edge` : `${diffWR}% drop`}).`,
      metricBadge: `${wrFollowed.toFixed(0)}% vs ${wrBroken.toFixed(0)}%`,
    });
  }

  // 3. Directional Bias (Long vs Short)
  const longs = closed.filter(t => t.direction === 'BUY');
  const shorts = closed.filter(t => t.direction === 'SELL');

  if (longs.length >= 2 && shorts.length >= 2) {
    const longPnl = longs.reduce((a, b) => a + b.netPnl, 0);
    const shortPnl = shorts.reduce((a, b) => a + b.netPnl, 0);
    const longWR = (longs.filter(t => t.netPnl > 0).length / longs.length) * 100;
    const shortWR = (shorts.filter(t => t.netPnl > 0).length / shorts.length) * 100;

    if (Math.abs(longPnl - shortPnl) > 300) {
      const isLongDominant = longPnl > shortPnl;
      insights.push({
        id: 'ins-direction',
        category: 'DIRECTION',
        type: 'POSITIVE',
        title: `${isLongDominant ? 'Long / Buy' : 'Short / Sell'} Positions Strongly Outperform`,
        description: `${isLongDominant ? 'Long' : 'Short'} trades generated $${Math.abs(Math.round(isLongDominant ? longPnl : shortPnl)).toLocaleString()} net P&L (${(isLongDominant ? longWR : shortWR).toFixed(0)}% WR) compared to $${Math.round(isLongDominant ? shortPnl : longPnl).toLocaleString()} on the opposing side.`,
        metricBadge: isLongDominant ? `${longWR.toFixed(0)}% Long WR` : `${shortWR.toFixed(0)}% Short WR`,
      });
    }
  }

  // 4. Day of Week Insight
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap: { [day: number]: { name: string; pnl: number; count: number; wins: number } } = {};
  
  closed.forEach(t => {
    if (!t.entryDate) return;
    const day = new Date(t.entryDate).getDay();
    if (!dayMap[day]) {
      dayMap[day] = { name: dayNames[day], pnl: 0, count: 0, wins: 0 };
    }
    dayMap[day].pnl += t.netPnl;
    dayMap[day].count += 1;
    if (t.netPnl > 0) dayMap[day].wins += 1;
  });

  const validDays = Object.values(dayMap).filter(d => d.count >= 2);
  if (validDays.length >= 2) {
    const bestDay = [...validDays].sort((a, b) => b.pnl - a.pnl)[0];
    const worstDay = [...validDays].sort((a, b) => a.pnl - b.pnl)[0];

    if (bestDay && bestDay.pnl > 200) {
      insights.push({
        id: 'ins-best-day',
        category: 'DAY_TIME',
        type: 'POSITIVE',
        title: `Highest Alpha Day: ${bestDay.name}`,
        description: `${bestDay.name}s show your cleanest execution consistency, netting $${Math.round(bestDay.pnl).toLocaleString()} across ${bestDay.count} executions (${Math.round((bestDay.wins / bestDay.count) * 100)}% win rate).`,
        metricBadge: `Top Day: ${bestDay.name}`,
      });
    }

    if (worstDay && worstDay.pnl < -100 && worstDay.name !== bestDay?.name) {
      insights.push({
        id: 'ins-worst-day',
        category: 'DAY_TIME',
        type: 'WARNING',
        title: `Vulnerability Detected on ${worstDay.name}`,
        description: `${worstDay.name} trading exhibits a historical drawdown of -$${Math.abs(Math.round(worstDay.pnl)).toLocaleString()}. Review market conditions or lower size on this day.`,
        metricBadge: `Weakest: ${worstDay.name}`,
      });
    }
  }

  // 5. Holding Time / Duration Insight
  const scalps = closed.filter(t => (t.durationMinutes || 0) <= 15);
  const intraday = closed.filter(t => (t.durationMinutes || 0) > 15 && (t.durationMinutes || 0) <= 120);
  const swings = closed.filter(t => (t.durationMinutes || 0) > 120);

  const durationBuckets = [
    { label: 'Scalps (≤15m)', trades: scalps },
    { label: 'Intraday (15m–2h)', trades: intraday },
    { label: 'Extended/Swing (>2h)', trades: swings },
  ].filter(b => b.trades.length >= 2);

  if (durationBuckets.length >= 2) {
    const bucketStats = durationBuckets.map(b => {
      const pnl = b.trades.reduce((a, c) => a + c.netPnl, 0);
      const wr = (b.trades.filter(t => t.netPnl > 0).length / b.trades.length) * 100;
      return { ...b, pnl, wr };
    });

    const bestBucket = [...bucketStats].sort((a, b) => b.pnl - a.pnl)[0];
    if (bestBucket && bestBucket.pnl > 0) {
      insights.push({
        id: 'ins-duration',
        category: 'DURATION',
        type: 'POSITIVE',
        title: `Optimal Holding Sweet Spot: ${bestBucket.label}`,
        description: `Your execution edge is maximized on ${bestBucket.label} trades, yielding $${Math.round(bestBucket.pnl).toLocaleString()} with a ${bestBucket.wr.toFixed(0)}% win rate.`,
        metricBadge: `${bestBucket.wr.toFixed(0)}% WR`,
      });
    }
  }

  // 6. Instrument Concentration
  const symbolMap: { [sym: string]: { count: number; pnl: number; wins: number } } = {};
  closed.forEach(t => {
    const s = t.symbol || 'OTHER';
    if (!symbolMap[s]) symbolMap[s] = { count: 0, pnl: 0, wins: 0 };
    symbolMap[s].count += 1;
    symbolMap[s].pnl += t.netPnl;
    if (t.netPnl > 0) symbolMap[s].wins += 1;
  });

  const symbolEntries = Object.entries(symbolMap).filter(([, val]) => val.count >= 2);
  if (symbolEntries.length > 0) {
    const sortedSymbols = symbolEntries.sort((a, b) => b[1].pnl - a[1].pnl);
    const topSym = sortedSymbols[0];
    if (topSym && topSym[1].pnl > 300) {
      const topWR = Math.round((topSym[1].wins / topSym[1].count) * 100);
      insights.push({
        id: 'ins-top-symbol',
        category: 'INSTRUMENT',
        type: 'POSITIVE',
        title: `${topSym[0]} is Your Core Alpha Generator`,
        description: `${topSym[0]} trades generated $${Math.round(topSym[1].pnl).toLocaleString()} (${topWR}% win rate across ${topSym[1].count} executions).`,
        metricBadge: `${topSym[0]} (+$${Math.round(topSym[1].pnl)})`,
      });
    }
  }

  return insights;
}
