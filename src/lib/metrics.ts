import { Trade } from '../types';
import {
  calculateComprehensiveMetrics,
  roundMoney,
  ComprehensiveMetrics,
  formatPercentage,
  formatProfitFactor,
  formatRValue
} from './calcEngine';

export interface PlaybookMetrics {
  totalTrades: number;
  winRate: number; // Decisive win rate (Wins / (Wins + Losses) * 100) or all trades win rate if no losses
  allTradesWinRate: number;
  netPnl: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  expectancy: number;
}

/**
 * Calculates standardized playbook metrics using the unified calculation engine.
 * 
 * Rules:
 * - Only CLOSED status trades are included.
 * - Realized P&L is determined by `netPnl`.
 * - Winning Trades: netPnl > 0
 * - Losing Trades: netPnl < 0
 * - Breakeven Trades: netPnl === 0. Excluded from decisive win rate denominator to avoid distorting strategy accuracy.
 * - Profit Factor = Gross Profit / Absolute Gross Loss. Returns Infinity (or clean cap) when 0 losses.
 * - Monetary Expectancy: (WinRate * AvgWin) - (LossRate * AvgLoss) or Net PnL / Total Closed Trades.
 */
export function calculatePlaybookMetrics(pbTrades: Trade[]): PlaybookMetrics {
  const m = calculateComprehensiveMetrics(pbTrades);

  return {
    totalTrades: m.closedTrades,
    winRate: m.winRate !== null ? m.winRate : 0,
    allTradesWinRate: m.allTradesWinRate,
    netPnl: m.netPnl,
    profitFactor: m.profitFactor !== null && isFinite(m.profitFactor) ? m.profitFactor : (m.grossProfit > 0 ? 99.99 : 0),
    avgWinner: m.avgWinningTrade,
    avgLoser: m.avgLosingTrade,
    expectancy: m.monetaryExpectancy,
  };
}

export {
  calculateComprehensiveMetrics,
  formatPercentage,
  formatProfitFactor,
  formatRValue,
  roundMoney
};
export type { ComprehensiveMetrics };
