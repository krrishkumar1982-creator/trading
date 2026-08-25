import { Trade, RiskGoalSettings } from '../../types';

export interface PerformanceMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage
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
  const closed = trades.filter(t => t.status === 'CLOSED');
  const open = trades.filter(t => t.status === 'OPEN');
  
  if (closed.length === 0) {
    return {
      totalTrades: trades.length,
      closedTrades: 0,
      openTrades: open.length,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalNetPnl: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      avgTradePnl: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      avgRMultiple: 0,
      expectancy: 0,
      totalCommissions: 0,
      maxDrawdownDollar: 0,
      maxDrawdownPercent: 0,
      currentDrawdownDollar: 0,
      currentDrawdownPercent: 0,
      avgDurationMinutes: 0,
      bestTradingDay: { date: 'N/A', pnl: 0 },
      worstTradingDay: { date: 'N/A', pnl: 0 },
      currentStreak: { type: 'NONE', count: 0 },
      longestWinStreak: 0,
      longestLossStreak: 0,
      rulesFollowedRate: 0,
    };
  }

  const winners = closed.filter(t => t.netPnl > 0);
  const losers = closed.filter(t => t.netPnl < 0);
  const breakevens = closed.filter(t => t.netPnl === 0);

  const winningTrades = winners.length;
  const losingTrades = losers.length;
  const breakevenTrades = breakevens.length;

  const winRate = (winningTrades / closed.length) * 100;
  const lossRate = (losingTrades / closed.length) * 100;

  const totalNetPnl = closed.reduce((acc, t) => acc + t.netPnl, 0);
  const grossProfit = winners.reduce((acc, t) => acc + t.netPnl, 0);
  const grossLoss = Math.abs(losers.reduce((acc, t) => acc + t.netPnl, 0));

  const profitFactor = grossLoss > 0 ? parseFloat((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

  const avgTradePnl = totalNetPnl / closed.length;
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;

  const pnls = closed.map(t => t.netPnl);
  const largestWin = winners.length > 0 ? Math.max(...pnls) : 0;
  const largestLoss = losers.length > 0 ? Math.min(...pnls) : 0;

  const avgRMultiple = closed.reduce((acc, t) => acc + (t.rMultiple || 0), 0) / closed.length;
  const expectancy = ((winRate / 100) * avgWin) - ((lossRate / 100) * avgLoss);
  const totalCommissions = closed.reduce((acc, t) => acc + (t.commission || 0) + (t.fees || 0), 0);

  // Chronological sort for equity, streaks, drawdown
  const chronoTrades = [...closed].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  // Drawdown calculation
  let runningEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdownDollar = 0;
  let maxDdPercent = 0;

  chronoTrades.forEach(t => {
    runningEquity += t.netPnl;
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const currentDd = peakEquity - runningEquity;
    const currentDdPct = peakEquity > 0 ? (currentDd / peakEquity) * 100 : 0;
    if (currentDd > maxDrawdownDollar) {
      maxDrawdownDollar = currentDd;
    }
    if (currentDdPct > maxDdPercent) {
      maxDdPercent = currentDdPct;
    }
  });

  const currentDrawdownDollar = Math.max(0, peakEquity - runningEquity);
  const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownDollar / peakEquity) * 100 : 0;

  // Duration
  const totalDuration = closed.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const avgDurationMinutes = Math.round(totalDuration / closed.length);

  // Group by day for best/worst trading day
  const dayPnlMap: { [date: string]: number } = {};
  chronoTrades.forEach(t => {
    const d = t.entryDate ? t.entryDate.split('T')[0] : 'N/A';
    dayPnlMap[d] = (dayPnlMap[d] || 0) + t.netPnl;
  });

  let bestDay = { date: 'N/A', pnl: -Infinity };
  let worstDay = { date: 'N/A', pnl: Infinity };

  Object.entries(dayPnlMap).forEach(([date, pnl]) => {
    if (pnl > bestDay.pnl) bestDay = { date, pnl };
    if (pnl < worstDay.pnl) worstDay = { date, pnl };
  });

  if (bestDay.pnl === -Infinity) bestDay = { date: 'N/A', pnl: 0 };
  if (worstDay.pnl === Infinity) worstDay = { date: 'N/A', pnl: 0 };

  // Streaks
  let currentStreakCount = 0;
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  chronoTrades.forEach(t => {
    if (t.netPnl > 0) {
      tempWinStreak += 1;
      tempLossStreak = 0;
      if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
    } else if (t.netPnl < 0) {
      tempLossStreak += 1;
      tempWinStreak = 0;
      if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
    } else {
      tempWinStreak = 0;
      tempLossStreak = 0;
    }
  });

  // Current streak from latest trades backwards
  const reversedTrades = [...chronoTrades].reverse();
  if (reversedTrades.length > 0) {
    const firstPnl = reversedTrades[0].netPnl;
    if (firstPnl > 0) {
      currentStreakType = 'WIN';
      for (const t of reversedTrades) {
        if (t.netPnl > 0) currentStreakCount++;
        else break;
      }
    } else if (firstPnl < 0) {
      currentStreakType = 'LOSS';
      for (const t of reversedTrades) {
        if (t.netPnl < 0) currentStreakCount++;
        else break;
      }
    }
  }

  const rulesFollowedCount = closed.filter(t => t.rulesFollowed).length;
  const rulesFollowedRate = Math.round((rulesFollowedCount / closed.length) * 100);

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: open.length,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: parseFloat(winRate.toFixed(1)),
    lossRate: parseFloat(lossRate.toFixed(1)),
    totalNetPnl,
    grossProfit,
    grossLoss,
    profitFactor,
    avgTradePnl,
    avgWin,
    avgLoss,
    winLossRatio: parseFloat(winLossRatio.toFixed(2)),
    largestWin,
    largestLoss,
    avgRMultiple: parseFloat(avgRMultiple.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    totalCommissions,
    maxDrawdownDollar,
    maxDrawdownPercent: parseFloat(maxDdPercent.toFixed(1)),
    currentDrawdownDollar,
    currentDrawdownPercent: parseFloat(currentDrawdownPercent.toFixed(1)),
    avgDurationMinutes,
    bestTradingDay: bestDay,
    worstTradingDay: worstDay,
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    longestWinStreak,
    longestLossStreak,
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
        description: `Your highest profitability occurs during the ${bestSession.session} session with a ${bestSession.wr.toFixed(0)}% win rate and $${bestSession.pnl.toLocaleString()} total net P&L across ${bestSession.count} trades.`,
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
