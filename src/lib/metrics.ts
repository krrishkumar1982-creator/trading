import { Trade } from '../types';

export interface PlaybookMetrics {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  expectancy: number;
}

/**
 * Calculates standardized playbook metrics from a set of trades.
 * This is the SINGLE AUTHORITATIVE SOURCE OF TRUTH for both frontend and backend.
 * 
 * Rules:
 * - Only CLOSED status trades are included.
 * - Realized P&L is determined by the `netPnl` field.
 * - Winning Trades: netPnl > 0
 * - Losing Trades: netPnl < 0
 * - Breakeven Trades: netPnl === 0. They are counted in totalTrades (and thus dilute the winRate), 
 *   but are excluded from both winningTrades and losingTrades lists, preventing them from being
 *   misclassified as wins or losses.
 * - Win Rate = (winningTrades.length / totalTrades) * 100
 * - Gross Profit = Sum of netPnl of winning trades
 * - Gross Loss = Sum of netPnl of losing trades (always negative or 0)
 * - Profit Factor = Gross Profit / Absolute Gross Loss.
 *   - If Gross Loss is 0: if Gross Profit > 0, returns 99.99 (standard cap for infinite PF); else returns 0.
 * - Average Win = Gross Profit / winningTrades.length (always positive or 0)
 * - Average Loss = Absolute Gross Loss / losingTrades.length (always positive or 0, adhering to positive sign convention)
 * - Expectancy = Net P&L / Total Trades (representing the expected average net PnL per closed trade)
 */
export function calculatePlaybookMetrics(pbTrades: Trade[]): PlaybookMetrics {
  const closedTrades = pbTrades.filter(t => t.status === 'CLOSED');
  const totalTrades = closedTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      profitFactor: 0,
      avgWinner: 0,
      avgLoser: 0,
      expectancy: 0,
    };
  }

  const winningTrades = closedTrades.filter(t => (t.netPnl || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.netPnl || 0) < 0);

  const winRate = (winningTrades.length / totalTrades) * 100;
  const netPnl = closedTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const grossLoss = losingTrades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
  const absGrossLoss = Math.abs(grossLoss);

  let profitFactor = 0;
  if (absGrossLoss > 0) {
    profitFactor = grossProfit / absGrossLoss;
  } else if (grossProfit > 0) {
    profitFactor = 99.99;
  }

  const avgWinner = winningTrades.length > 0 ? (grossProfit / winningTrades.length) : 0;
  const avgLoser = losingTrades.length > 0 ? (absGrossLoss / losingTrades.length) : 0;

  const expectancy = netPnl / totalTrades;

  return {
    totalTrades,
    winRate,
    netPnl,
    profitFactor,
    avgWinner,
    avgLoser,
    expectancy,
  };
}
