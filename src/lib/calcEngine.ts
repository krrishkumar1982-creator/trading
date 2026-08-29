/**
 * TradeForge Unified Calculation & Financial Mathematics Engine
 * 
 * Single Source of Truth for all financial, statistical, risk, and prop-firm metrics.
 * Implements strict precision arithmetic, transparent edge-case handling, and configurable rules.
 */

import { Trade } from '../types';

// ============================================================================
// 1. PRECISION & MONEY MATH
// ============================================================================

/**
 * Rounds a number to a specified number of decimal places (default 2 for currency)
 * to avoid standard IEEE-754 floating-point errors.
 */
export function roundMoney(value: number, decimals: number = 2): number {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Safe addition avoiding floating-point drift: 0.1 + 0.2 -> 0.30
 */
export function safeAdd(...numbers: number[]): number {
  const sum = numbers.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
  return roundMoney(sum, 4);
}

/**
 * Safe subtraction: a - b
 */
export function safeSub(a: number, b: number): number {
  return roundMoney((Number.isFinite(a) ? a : 0) - (Number.isFinite(b) ? b : 0), 4);
}

/**
 * Safe multiplication
 */
export function safeMul(a: number, b: number): number {
  return roundMoney((Number.isFinite(a) ? a : 0) * (Number.isFinite(b) ? b : 0), 4);
}

/**
 * Safe division with zero division handling
 */
export function safeDiv(numerator: number, denominator: number, fallback: number | null = null): number | null {
  if (!Number.isFinite(denominator) || denominator === 0) {
    return fallback;
  }
  if (!Number.isFinite(numerator)) {
    return fallback;
  }
  return roundMoney(numerator / denominator, 4);
}

// ============================================================================
// 2. CORE TRADE METRIC DEFINITIONS & CALCULATIONS
// ============================================================================

export interface TradeCostBreakdown {
  commission: number;
  fees: number;
  swap: number;
  totalCosts: number;
}

/**
 * Extracts and sums all explicit transaction costs for a trade.
 */
export function getTradeCosts(trade: Partial<Trade>): TradeCostBreakdown {
  const commission = Number.isFinite(trade.commission) ? Number(trade.commission) : 0;
  const fees = Number.isFinite(trade.fees) ? Number(trade.fees) : 0;
  const swap = Number.isFinite(trade.swap) ? Number(trade.swap) : 0;
  const totalCosts = roundMoney(commission + fees + swap, 2);
  return { commission, fees, swap, totalCosts };
}

/**
 * Computes Gross and Net P&L for a trade.
 * Net P&L = Gross P&L - (Commissions + Fees + Swap/Financing)
 */
export function calculateTradePnl(
  trade: Partial<Trade> & { contractMultiplier?: number; riskAmount?: number }
): { grossPnl: number; netPnl: number; costs: number } {
  const costs = getTradeCosts(trade).totalCosts;

  if (Number.isFinite(trade.netPnl) && trade.grossPnl === undefined) {
    const netPnl = roundMoney(trade.netPnl!, 2);
    const grossPnl = roundMoney(netPnl + costs, 2);
    return { grossPnl, netPnl, costs };
  }

  if (Number.isFinite(trade.grossPnl)) {
    const grossPnl = roundMoney(trade.grossPnl!, 2);
    const netPnl = roundMoney(grossPnl - costs, 2);
    return { grossPnl, netPnl, costs };
  }

  // Calculate from entryPrice, exitPrice, quantity, direction, multiplier
  const entry = trade.entryPrice;
  const exit = trade.exitPrice;
  const qty = trade.quantity || 1;
  const mult = trade.contractMultiplier || 1;

  if (Number.isFinite(entry) && Number.isFinite(exit)) {
    let diff = 0;
    if (trade.direction === 'SELL') {
      diff = entry! - exit!;
    } else {
      diff = exit! - entry!;
    }
    const grossPnl = roundMoney(diff * qty * mult, 2);
    const netPnl = roundMoney(grossPnl - costs, 2);
    return { grossPnl, netPnl, costs };
  }

  return { grossPnl: 0, netPnl: 0, costs };
}

/**
 * Calculates R-Multiple for a trade:
 * Long:  (Exit Price - Entry Price) / (Entry Price - Stop Loss)
 * Short: (Entry Price - Exit Price) / (Stop Loss - Entry Price)
 * 
 * Returns null if Stop Loss is missing/zero or risk distance is non-positive.
 */
export function calculateTradeRMultiple(
  trade: Partial<Trade> & { riskAmount?: number }
): number | null {
  // 1. If R-multiple is explicitly pre-recorded and valid:
  if (trade.rMultiple !== undefined && trade.rMultiple !== null && Number.isFinite(trade.rMultiple)) {
    return roundMoney(trade.rMultiple, 2);
  }

  const entry = trade.entryPrice;
  const exit = trade.exitPrice;
  const stop = trade.stopLoss;
  const isShort = trade.direction === 'SELL';

  // Price-based R calculation
  if (Number.isFinite(entry) && Number.isFinite(exit) && Number.isFinite(stop) && stop! > 0) {
    const riskPerUnit = isShort ? (stop! - entry!) : (entry! - stop!);
    if (riskPerUnit > 0) {
      const rewardPerUnit = isShort ? (entry! - exit!) : (exit! - entry!);
      return roundMoney(rewardPerUnit / riskPerUnit, 2);
    }
  }

  // Dollar-based R calculation (if initial risk dollars is known)
  if (trade.riskAmount && trade.riskAmount > 0 && Number.isFinite(trade.netPnl)) {
    return roundMoney(trade.netPnl! / trade.riskAmount, 2);
  }

  return null;
}

// ============================================================================
// 3. AGGREGATE PERFORMANCE METRICS ENGINE
// ============================================================================

export interface ComprehensiveMetrics {
  // Counts
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  decisiveTrades: number; // winningTrades + losingTrades

  // Win Rates
  winRate: number | null; // Primary: Wins / (Wins + Losses) * 100. Null if decisiveTrades === 0
  allTradesWinRate: number; // Secondary: Wins / Total Closed Trades * 100
  lossRate: number | null; // Losses / (Wins + Losses) * 100. Null if decisiveTrades === 0
  breakevenRate: number; // Breakevens / Total Closed Trades * 100

  // P&L
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  totalCosts: number;
  totalCommissions: number;
  totalFees: number;
  totalSwap: number;

  // Profit Factor & Ratios
  profitFactor: number | null; // Gross Profit / Gross Loss. Infinity if Gross Loss === 0 and Gross Profit > 0
  payoffRatio: number | null; // Avg Win / Avg Loss. Infinity if Avg Loss === 0 and Avg Win > 0
  
  // Averages & Trade Sizes
  avgTradePnl: number; // Net PnL / Total Closed Trades
  avgWinningTrade: number; // Gross Profit / Winning Trades
  avgLosingTrade: number; // Gross Loss / Losing Trades
  largestWin: number;
  largestLoss: number;

  // Expectancy
  monetaryExpectancy: number; // (WinRate * AvgWin) - (LossRate * AvgLoss) - AvgCosts
  rMultipleExpectancy: number | null; // (WinRate * AvgWinR) - (LossRate * AvgLossR)
  avgRMultiple: number | null;
  totalRMultiple: number;

  // Drawdown & Capital
  maxDrawdownDollars: number;
  maxDrawdownPercent: number;
  currentDrawdownDollars: number;
  currentDrawdownPercent: number;
  peakEquity: number;
  finalEquity: number;
  recoveryFactor: number | null; // Net PnL / Max Drawdown Dollars

  // Streaks
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Daily Consistency
  totalTradingDays: number;
  winningDays: number;
  losingDays: number;
  breakevenDays: number;
  dayWinRate: number | null;
  bestDayPnl: number;
  worstDayPnl: number;
  avgDailyPnl: number;
  maxConsecutiveGreenDays: number;
  maxConsecutiveRedDays: number;

  // Risk & Statistics
  dailyStdDev: number;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  profitTargetProgress?: number;
}

export interface MetricsCalculationOptions {
  initialBalance?: number;
  timezone?: string;
  breakevenThreshold?: number;
  riskFreeRateAnnual?: number;
}

/**
 * Computes all authoritative performance metrics for any set of trades.
 */
export function calculateComprehensiveMetrics(
  trades: Trade[],
  options: MetricsCalculationOptions = {}
): ComprehensiveMetrics {
  const initialBalance = options.initialBalance ?? 50000;
  const breakevenThreshold = options.breakevenThreshold ?? 0.001;
  const riskFreeRateAnnual = options.riskFreeRateAnnual ?? 0.04;

  const closed = trades.filter(t => t.status === 'CLOSED');
  const openTradesCount = trades.filter(t => t.status === 'OPEN').length;
  const totalClosed = closed.length;

  if (totalClosed === 0) {
    return {
      totalTrades: trades.length,
      closedTrades: 0,
      openTrades: openTradesCount,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      decisiveTrades: 0,
      winRate: null,
      allTradesWinRate: 0,
      lossRate: null,
      breakevenRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnl: 0,
      totalCosts: 0,
      totalCommissions: 0,
      totalFees: 0,
      totalSwap: 0,
      profitFactor: null,
      payoffRatio: null,
      avgTradePnl: 0,
      avgWinningTrade: 0,
      avgLosingTrade: 0,
      largestWin: 0,
      largestLoss: 0,
      monetaryExpectancy: 0,
      rMultipleExpectancy: null,
      avgRMultiple: null,
      totalRMultiple: 0,
      maxDrawdownDollars: 0,
      maxDrawdownPercent: 0,
      currentDrawdownDollars: 0,
      currentDrawdownPercent: 0,
      peakEquity: initialBalance,
      finalEquity: initialBalance,
      recoveryFactor: null,
      currentStreak: { type: 'NONE', count: 0 },
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      totalTradingDays: 0,
      winningDays: 0,
      losingDays: 0,
      breakevenDays: 0,
      dayWinRate: null,
      bestDayPnl: 0,
      worstDayPnl: 0,
      avgDailyPnl: 0,
      maxConsecutiveGreenDays: 0,
      maxConsecutiveRedDays: 0,
      dailyStdDev: 0,
      sharpeRatio: null,
      sortinoRatio: null,
    };
  }

  // Sort chronologically for streak and drawdown calculations
  const sortedClosed = [...closed].sort((a, b) => {
    const timeA = new Date(a.entryDate || a.exitDate || 0).getTime();
    const timeB = new Date(b.entryDate || b.exitDate || 0).getTime();
    return timeA - timeB;
  });

  const winners: Trade[] = [];
  const losers: Trade[] = [];
  const breakevens: Trade[] = [];

  let grossProfit = 0;
  let grossLoss = 0;
  let netPnl = 0;
  let totalCommissions = 0;
  let totalFees = 0;
  let totalSwap = 0;
  let largestWin = 0;
  let largestLoss = 0;

  // Streaks
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
  let currentStreakCount = 0;
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let tempWinStreak = 0;
  let tempLossStreak = 0;

  // R-Multiple calculations
  let validRCount = 0;
  let sumRMultiple = 0;
  let sumWinningR = 0;
  let sumLosingR = 0;
  let winningRCount = 0;
  let losingRCount = 0;

  // Drawdown tracking
  let runningEquity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdownDollars = 0;
  let maxDrawdownPercent = 0;

  sortedClosed.forEach(t => {
    const tradePnl = t.netPnl;
    const costs = getTradeCosts(t);
    totalCommissions = safeAdd(totalCommissions, costs.commission);
    totalFees = safeAdd(totalFees, costs.fees);
    totalSwap = safeAdd(totalSwap, costs.swap);
    netPnl = safeAdd(netPnl, tradePnl);

    // Equity and Peak-to-Trough Drawdown
    runningEquity = safeAdd(runningEquity, tradePnl);
    if (runningEquity > peakEquity) {
      peakEquity = runningEquity;
    }
    const currentDdDollars = safeSub(peakEquity, runningEquity);
    const currentDdPercent = peakEquity > 0 ? roundMoney((currentDdDollars / peakEquity) * 100, 2) : 0;
    
    if (currentDdDollars > maxDrawdownDollars) {
      maxDrawdownDollars = currentDdDollars;
    }
    if (currentDdPercent > maxDrawdownPercent) {
      maxDrawdownPercent = currentDdPercent;
    }

    // Outcome classification with breakeven threshold
    if (tradePnl > breakevenThreshold) {
      winners.push(t);
      grossProfit = safeAdd(grossProfit, tradePnl);
      if (tradePnl > largestWin) largestWin = tradePnl;

      // Streaks
      tempWinStreak += 1;
      tempLossStreak = 0;
      if (tempWinStreak > maxConsecutiveWins) maxConsecutiveWins = tempWinStreak;
      currentStreakType = 'WIN';
      currentStreakCount = tempWinStreak;
    } else if (tradePnl < -breakevenThreshold) {
      losers.push(t);
      const absLoss = Math.abs(tradePnl);
      grossLoss = safeAdd(grossLoss, absLoss);
      if (absLoss > largestLoss) largestLoss = absLoss;

      // Streaks
      tempLossStreak += 1;
      tempWinStreak = 0;
      if (tempLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = tempLossStreak;
      currentStreakType = 'LOSS';
      currentStreakCount = tempLossStreak;
    } else {
      breakevens.push(t);
      tempWinStreak = 0;
      tempLossStreak = 0;
    }

    // R-Multiple
    const r = calculateTradeRMultiple(t);
    if (r !== null && Number.isFinite(r)) {
      validRCount += 1;
      sumRMultiple = safeAdd(sumRMultiple, r);
      if (r > 0) {
        sumWinningR = safeAdd(sumWinningR, r);
        winningRCount += 1;
      } else if (r < 0) {
        sumLosingR = safeAdd(sumLosingR, Math.abs(r));
        losingRCount += 1;
      }
    }
  });

  const totalCosts = safeAdd(totalCommissions, totalFees, totalSwap);
  const winningTrades = winners.length;
  const losingTrades = losers.length;
  const breakevenTrades = breakevens.length;
  const decisiveTrades = winningTrades + losingTrades;

  // Win Rate: Primary (Wins / Decisive Trades) and Secondary (Wins / Total Closed)
  const winRate = decisiveTrades > 0 ? roundMoney((winningTrades / decisiveTrades) * 100, 2) : null;
  const allTradesWinRate = totalClosed > 0 ? roundMoney((winningTrades / totalClosed) * 100, 2) : 0;
  const lossRate = decisiveTrades > 0 ? roundMoney((losingTrades / decisiveTrades) * 100, 2) : null;
  const breakevenRate = totalClosed > 0 ? roundMoney((breakevenTrades / totalClosed) * 100, 2) : 0;

  // Profit Factor: Gross Profit / Gross Loss
  let profitFactor: number | null = null;
  if (grossLoss > 0) {
    profitFactor = roundMoney(grossProfit / grossLoss, 2);
  } else if (grossProfit > 0) {
    profitFactor = Infinity;
  } else {
    profitFactor = null;
  }

  // Averages
  const avgWinningTrade = winningTrades > 0 ? roundMoney(grossProfit / winningTrades, 2) : 0;
  const avgLosingTrade = losingTrades > 0 ? roundMoney(grossLoss / losingTrades, 2) : 0;
  const avgTradePnl = totalClosed > 0 ? roundMoney(netPnl / totalClosed, 2) : 0;

  // Payoff Ratio (Avg Win / Avg Loss)
  let payoffRatio: number | null = null;
  if (avgLosingTrade > 0) {
    payoffRatio = roundMoney(avgWinningTrade / avgLosingTrade, 2);
  } else if (avgWinningTrade > 0) {
    payoffRatio = Infinity;
  }

  // Monetary Expectancy: (WinRateDecisive% * AvgWin) - (LossRateDecisive% * AvgLoss)
  let monetaryExpectancy = 0;
  if (decisiveTrades > 0 && winRate !== null && lossRate !== null) {
    const wProb = winRate / 100;
    const lProb = lossRate / 100;
    monetaryExpectancy = roundMoney((wProb * avgWinningTrade) - (lProb * avgLosingTrade), 2);
  } else if (totalClosed > 0) {
    monetaryExpectancy = avgTradePnl;
  }

  // R-Multiple Expectancy
  let rMultipleExpectancy: number | null = null;
  let avgRMultiple: number | null = null;
  if (validRCount > 0) {
    avgRMultiple = roundMoney(sumRMultiple / validRCount, 2);
    if (decisiveTrades > 0 && winRate !== null && lossRate !== null) {
      const avgWinR = winningRCount > 0 ? sumWinningR / winningRCount : 0;
      const avgLossR = losingRCount > 0 ? sumLosingR / losingRCount : 1;
      const wProb = winRate / 100;
      const lProb = lossRate / 100;
      rMultipleExpectancy = roundMoney((wProb * avgWinR) - (lProb * avgLossR), 2);
    }
  }

  // Current Drawdown
  const currentDrawdownDollars = safeSub(peakEquity, runningEquity);
  const currentDrawdownPercent = peakEquity > 0 ? roundMoney((currentDrawdownDollars / peakEquity) * 100, 2) : 0;
  
  // Recovery Factor = Net PnL / Max Drawdown Dollars
  let recoveryFactor: number | null = null;
  if (maxDrawdownDollars > 0) {
    recoveryFactor = roundMoney(netPnl / maxDrawdownDollars, 2);
  } else if (netPnl > 0) {
    recoveryFactor = Infinity;
  }

  // ==========================================
  // Daily Grouping & Consistency Statistics
  // ==========================================
  const dayPnlMap = new Map<string, number>();
  sortedClosed.forEach(t => {
    const dateKey = t.entryDate ? t.entryDate.split('T')[0] : 'UNKNOWN_DAY';
    const currentDayPnl = dayPnlMap.get(dateKey) || 0;
    dayPnlMap.set(dateKey, safeAdd(currentDayPnl, t.netPnl));
  });

  const dailyPnls = Array.from(dayPnlMap.values());
  const totalTradingDays = dailyPnls.length;
  const winningDays = dailyPnls.filter(pnl => pnl > breakevenThreshold).length;
  const losingDays = dailyPnls.filter(pnl => pnl < -breakevenThreshold).length;
  const breakevenDays = dailyPnls.filter(pnl => Math.abs(pnl) <= breakevenThreshold).length;
  const decisiveDays = winningDays + losingDays;
  const dayWinRate = decisiveDays > 0 ? roundMoney((winningDays / decisiveDays) * 100, 2) : null;

  const bestDayPnl = dailyPnls.length > 0 ? Math.max(...dailyPnls) : 0;
  const worstDayPnl = dailyPnls.length > 0 ? Math.min(...dailyPnls) : 0;
  const avgDailyPnl = totalTradingDays > 0 ? roundMoney(netPnl / totalTradingDays, 2) : 0;

  // Daily consecutive streaks
  let maxConsecutiveGreenDays = 0;
  let maxConsecutiveRedDays = 0;
  let tempGreen = 0;
  let tempRed = 0;

  dailyPnls.forEach(pnl => {
    if (pnl > breakevenThreshold) {
      tempGreen += 1;
      tempRed = 0;
      if (tempGreen > maxConsecutiveGreenDays) maxConsecutiveGreenDays = tempGreen;
    } else if (pnl < -breakevenThreshold) {
      tempRed += 1;
      tempGreen = 0;
      if (tempRed > maxConsecutiveRedDays) maxConsecutiveRedDays = tempRed;
    } else {
      tempGreen = 0;
      tempRed = 0;
    }
  });

  // Daily Standard Deviation & Sharpe/Sortino Ratios
  let dailyStdDev = 0;
  let sharpeRatio: number | null = null;
  let sortinoRatio: number | null = null;

  if (totalTradingDays > 1) {
    const meanDaily = netPnl / totalTradingDays;
    const variance = dailyPnls.reduce((acc, pnl) => acc + Math.pow(pnl - meanDaily, 2), 0) / (totalTradingDays - 1);
    dailyStdDev = roundMoney(Math.sqrt(variance), 2);

    const downsideVariance = dailyPnls
      .filter(pnl => pnl < 0)
      .reduce((acc, pnl) => acc + Math.pow(pnl, 2), 0) / (totalTradingDays - 1);
    const downsideStdDev = Math.sqrt(downsideVariance);

    const dailyRiskFreeReturn = (initialBalance * riskFreeRateAnnual) / 252;
    const excessMeanReturn = meanDaily - dailyRiskFreeReturn;

    if (dailyStdDev > 0) {
      sharpeRatio = roundMoney((excessMeanReturn / dailyStdDev) * Math.sqrt(252), 2);
    }
    if (downsideStdDev > 0) {
      sortinoRatio = roundMoney((excessMeanReturn / downsideStdDev) * Math.sqrt(252), 2);
    }
  }

  return {
    totalTrades: trades.length,
    closedTrades: totalClosed,
    openTrades: openTradesCount,
    winningTrades,
    losingTrades,
    breakevenTrades,
    decisiveTrades,
    winRate,
    allTradesWinRate,
    lossRate,
    breakevenRate,
    grossProfit,
    grossLoss,
    netPnl,
    totalCosts,
    totalCommissions,
    totalFees,
    totalSwap,
    profitFactor,
    payoffRatio,
    avgTradePnl,
    avgWinningTrade,
    avgLosingTrade,
    largestWin,
    largestLoss,
    monetaryExpectancy,
    rMultipleExpectancy,
    avgRMultiple,
    totalRMultiple: sumRMultiple,
    maxDrawdownDollars,
    maxDrawdownPercent,
    currentDrawdownDollars,
    currentDrawdownPercent,
    peakEquity,
    finalEquity: runningEquity,
    recoveryFactor,
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    maxConsecutiveWins,
    maxConsecutiveLosses,
    totalTradingDays,
    winningDays,
    losingDays,
    breakevenDays,
    dayWinRate,
    bestDayPnl,
    worstDayPnl,
    avgDailyPnl,
    maxConsecutiveGreenDays,
    maxConsecutiveRedDays,
    dailyStdDev,
    sharpeRatio,
    sortinoRatio,
  };
}

// ============================================================================
// 4. POSITION SIZING & RISK CALCULATOR ENGINE
// ============================================================================

export type AssetClass = 'FUTURES' | 'FOREX' | 'STOCKS' | 'CRYPTO';

export interface PositionSizeInput {
  assetClass: AssetClass;
  accountBalance: number;
  riskPercent?: number;
  riskDollars?: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  
  // Asset specific specs
  futuresTickSize?: number;
  futuresTickValue?: number;
  futuresContractMultiplier?: number;
  forexPipSize?: number;
  forexPipValuePerStandardLot?: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  positionUnits: number;
  maxContracts: number;
  stopLossDistance: number;
  stopLossTicksOrPips: number;
  totalPositionValue: number;
  estimatedProfitAtTarget: number | null;
  riskRewardRatio: number | null;
  rMultiple: number | null;
  riskPercentOfAccount: number;
}

/**
 * Calculates exact position sizing with mathematically verified tick/pip values.
 */
export function calculatePositionSize(input: PositionSizeInput): PositionSizeResult {
  const balance = Math.max(1, input.accountBalance);
  let riskAmount = input.riskDollars ?? 0;

  if (input.riskPercent !== undefined && input.riskPercent > 0) {
    riskAmount = roundMoney((balance * input.riskPercent) / 100, 2);
  }

  const entry = input.entryPrice;
  const stop = input.stopLossPrice;
  const tp = input.takeProfitPrice;
  const priceDistance = Math.abs(entry - stop);

  if (priceDistance <= 0 || riskAmount <= 0) {
    return {
      riskAmount: 0,
      positionUnits: 0,
      maxContracts: 0,
      stopLossDistance: 0,
      stopLossTicksOrPips: 0,
      totalPositionValue: 0,
      estimatedProfitAtTarget: null,
      riskRewardRatio: null,
      rMultiple: null,
      riskPercentOfAccount: 0,
    };
  }

  let positionUnits = 0;
  let stopLossTicksOrPips = 0;
  let totalPositionValue = 0;

  switch (input.assetClass) {
    case 'FUTURES': {
      const tickSize = input.futuresTickSize || 0.25;
      const tickValue = input.futuresTickValue || 5.0;
      stopLossTicksOrPips = roundMoney(priceDistance / tickSize, 1);
      const riskPerContract = stopLossTicksOrPips * tickValue;
      positionUnits = riskPerContract > 0 ? Math.floor(riskAmount / riskPerContract) : 0;
      totalPositionValue = positionUnits * entry * (input.futuresContractMultiplier || 20);
      break;
    }
    case 'FOREX': {
      const pipSize = input.forexPipSize || 0.0001;
      const pipValuePerLot = input.forexPipValuePerStandardLot || 10.0;
      stopLossTicksOrPips = roundMoney(priceDistance / pipSize, 1);
      const riskPerStandardLot = stopLossTicksOrPips * pipValuePerLot;
      positionUnits = riskPerStandardLot > 0 ? roundMoney(riskAmount / riskPerStandardLot, 2) : 0;
      totalPositionValue = positionUnits * 100000 * entry;
      break;
    }
    case 'STOCKS':
    case 'CRYPTO':
    default: {
      stopLossTicksOrPips = roundMoney(priceDistance, 2);
      positionUnits = priceDistance > 0 ? Math.floor(riskAmount / priceDistance) : 0;
      totalPositionValue = roundMoney(positionUnits * entry, 2);
      break;
    }
  }

  // Risk / Reward & Target Profit
  let estimatedProfitAtTarget: number | null = null;
  let riskRewardRatio: number | null = null;

  if (tp && tp > 0) {
    const targetDistance = Math.abs(tp - entry);
    riskRewardRatio = roundMoney(targetDistance / priceDistance, 2);
    estimatedProfitAtTarget = roundMoney(riskAmount * riskRewardRatio, 2);
  }

  const riskPercentOfAccount = roundMoney((riskAmount / balance) * 100, 2);

  return {
    riskAmount,
    positionUnits,
    maxContracts: positionUnits,
    stopLossDistance: roundMoney(priceDistance, 4),
    stopLossTicksOrPips,
    totalPositionValue: roundMoney(totalPositionValue, 2),
    estimatedProfitAtTarget,
    riskRewardRatio,
    rMultiple: riskRewardRatio,
    riskPercentOfAccount,
  };
}

// ============================================================================
// 5. COMPOUNDING PROJECTION ENGINE
// ============================================================================

export interface CompoundingMonthResult {
  month: number;
  startBalance: number;
  monthlyGain: number;
  monthlyContribution: number;
  endBalance: number;
  cumulativeProfit: number;
  cumulativeGrowthPercent: number;
}

export interface CompoundingProjectionResult {
  initialBalance: number;
  finalBalance: number;
  totalNetProfit: number;
  totalContributions: number;
  totalGrowthPercent: number;
  monthlyBreakdown: CompoundingMonthResult[];
}

/**
 * Calculates accurate monthly compounding growth projection.
 */
export function calculateCompoundingProjection(
  initialBalance: number,
  monthlyGainPercent: number,
  months: number,
  monthlyContribution: number = 0
): CompoundingProjectionResult {
  const breakdown: CompoundingMonthResult[] = [];
  let currentBalance = Math.max(0, initialBalance);
  let totalContributions = 0;

  for (let m = 1; m <= months; m++) {
    const startBalance = currentBalance;
    const monthlyGain = roundMoney(startBalance * (monthlyGainPercent / 100), 2);
    const contribution = roundMoney(monthlyContribution, 2);
    totalContributions = safeAdd(totalContributions, contribution);
    currentBalance = safeAdd(startBalance, monthlyGain, contribution);

    const cumulativeProfit = safeSub(currentBalance, safeAdd(initialBalance, totalContributions));
    const cumulativeGrowthPercent = initialBalance > 0
      ? roundMoney(((currentBalance - initialBalance) / initialBalance) * 100, 2)
      : 0;

    breakdown.push({
      month: m,
      startBalance,
      monthlyGain,
      monthlyContribution: contribution,
      endBalance: currentBalance,
      cumulativeProfit,
      cumulativeGrowthPercent,
    });
  }

  const finalBalance = currentBalance;
  const totalNetProfit = safeSub(finalBalance, safeAdd(initialBalance, totalContributions));
  const totalGrowthPercent = initialBalance > 0
    ? roundMoney(((finalBalance - initialBalance) / initialBalance) * 100, 2)
    : 0;

  return {
    initialBalance,
    finalBalance,
    totalNetProfit,
    totalContributions,
    totalGrowthPercent,
    monthlyBreakdown: breakdown,
  };
}

// ============================================================================
// 6. FORMATTING UTILITIES FOR TRANSPARENT UI DISPLAY
// ============================================================================

/**
 * Safely formats a win rate or percentage.
 * Returns 'N/A' when value is null.
 */
export function formatPercentage(val: number | null | undefined, decimals: number = 1): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  return `${val.toFixed(decimals)}%`;
}

/**
 * Safely formats a Profit Factor.
 * Handles Infinity cleanly as '∞' or 'Infinite (0 Losses)'.
 */
export function formatProfitFactor(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  if (!isFinite(val) || val === Infinity) {
    return '∞';
  }
  return val.toFixed(2);
}

/**
 * Safely formats an R-Multiple value.
 */
export function formatRValue(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return 'N/A';
  }
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}R`;
}
