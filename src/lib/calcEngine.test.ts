import { describe, it, expect } from 'vitest';
import {
  roundMoney,
  safeAdd,
  safeSub,
  safeMul,
  safeDiv,
  calculateTradePnl,
  calculateTradeRMultiple,
  calculateComprehensiveMetrics,
  calculatePositionSize,
  calculateCompoundingProjection,
} from './calcEngine';
import { Trade } from '../types';

describe('calcEngine: Precision Money Math', () => {
  it('prevents floating point errors in addition and subtraction', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // standard JS IEEE-754 quirk
    expect(safeAdd(0.1, 0.2)).toBe(0.3);
    expect(safeSub(1.0, 0.9)).toBe(0.1);
    expect(safeMul(0.1, 0.2)).toBe(0.02);
    expect(safeDiv(10, 3)).toBe(3.3333);
    expect(safeDiv(10, 0, null)).toBeNull();
  });

  it('rounds money correctly', () => {
    expect(roundMoney(123.456, 2)).toBe(123.46);
    expect(roundMoney(1.005, 2)).toBe(1.01);
  });
});

describe('calcEngine: Individual Trade PnL & Costs', () => {
  it('deducts commissions, fees, and swap to arrive at net PnL', () => {
    const trade: Partial<Trade> = {
      grossPnl: 500,
      commission: 4.5,
      fees: 1.25,
      swap: 2.0,
    };
    const result = calculateTradePnl(trade);
    expect(result.grossPnl).toBe(500);
    expect(result.costs).toBe(7.75);
    expect(result.netPnl).toBe(492.25);
  });

  it('computes gross and net PnL from entry, exit, qty, and multiplier for LONG', () => {
    const trade = {
      direction: 'BUY' as const,
      entryPrice: 20000,
      exitPrice: 20020,
      quantity: 2,
      contractMultiplier: 20, // NQ
      commission: 8,
      fees: 2,
    };
    const result = calculateTradePnl(trade);
    // (20020 - 20000) * 2 * 20 = 20 * 40 = 800 gross
    expect(result.grossPnl).toBe(800);
    expect(result.costs).toBe(10);
    expect(result.netPnl).toBe(790);
  });

  it('computes gross and net PnL from entry, exit, qty, and multiplier for SHORT', () => {
    const trade = {
      direction: 'SELL' as const,
      entryPrice: 20020,
      exitPrice: 20000,
      quantity: 1,
      contractMultiplier: 20,
      commission: 4,
      fees: 1,
    };
    const result = calculateTradePnl(trade);
    expect(result.grossPnl).toBe(400);
    expect(result.costs).toBe(5);
    expect(result.netPnl).toBe(395);
  });
});

describe('calcEngine: R-Multiple Calculations', () => {
  it('calculates price-based R for LONG trade', () => {
    const trade: Partial<Trade> = {
      direction: 'BUY',
      entryPrice: 100,
      stopLoss: 90,
      exitPrice: 130,
    };
    // Risk = 10, Reward = 30 -> 3.0R
    expect(calculateTradeRMultiple(trade)).toBe(3.0);
  });

  it('calculates price-based R for SHORT trade', () => {
    const trade: Partial<Trade> = {
      direction: 'SELL',
      entryPrice: 100,
      stopLoss: 110,
      exitPrice: 80,
    };
    // Risk = 10, Reward = 20 -> 2.0R
    expect(calculateTradeRMultiple(trade)).toBe(2.0);
  });

  it('returns null if stop loss is missing or invalid', () => {
    const trade: Partial<Trade> = {
      direction: 'BUY',
      entryPrice: 100,
      exitPrice: 120,
    };
    expect(calculateTradeRMultiple(trade)).toBeNull();
  });
});

describe('calcEngine: Comprehensive Performance Metrics', () => {
  const mockTrades: Trade[] = [
    {
      id: '1',
      accountId: 'acc-1',
      symbol: 'NQ',
      market: 'Futures',
      direction: 'BUY',
      status: 'CLOSED',
      entryPrice: 20000,
      exitPrice: 20025,
      quantity: 1,
      grossPnl: 500,
      netPnl: 500,
      commission: 0,
      swap: 0,
      fees: 0,
      rMultiple: 2.5,
      roiPercent: 1.0,
      session: 'New York',
      setupType: 'Breakout',
      rating: 5,
      notes: '',
      tags: [],
      mistakes: [],
      rulesFollowed: true,
      durationMinutes: 30,
      entryDate: '2026-03-01T10:00:00Z',
      exitDate: '2026-03-01T10:30:00Z',
    },
    {
      id: '2',
      accountId: 'acc-1',
      symbol: 'NQ',
      market: 'Futures',
      direction: 'BUY',
      status: 'CLOSED',
      entryPrice: 20025,
      exitPrice: 20015,
      quantity: 1,
      grossPnl: -200,
      netPnl: -200,
      commission: 0,
      swap: 0,
      fees: 0,
      rMultiple: -1.0,
      roiPercent: -0.4,
      session: 'New York',
      setupType: 'Breakout',
      rating: 3,
      notes: '',
      tags: [],
      mistakes: [],
      rulesFollowed: true,
      durationMinutes: 15,
      entryDate: '2026-03-01T11:00:00Z',
      exitDate: '2026-03-01T11:15:00Z',
    },
    {
      id: '3',
      accountId: 'acc-1',
      symbol: 'NQ',
      market: 'Futures',
      direction: 'SELL',
      status: 'CLOSED',
      entryPrice: 20015,
      exitPrice: 20015,
      quantity: 1,
      grossPnl: 0,
      netPnl: 0,
      commission: 0,
      swap: 0,
      fees: 0,
      rMultiple: 0,
      roiPercent: 0,
      session: 'New York',
      setupType: 'Breakout',
      rating: 4,
      notes: '',
      tags: [],
      mistakes: [],
      rulesFollowed: true,
      durationMinutes: 5,
      entryDate: '2026-03-02T10:00:00Z',
      exitDate: '2026-03-02T10:05:00Z',
    },
    {
      id: '4',
      accountId: 'acc-1',
      symbol: 'NQ',
      market: 'Futures',
      direction: 'BUY',
      status: 'CLOSED',
      entryPrice: 20015,
      exitPrice: 20040,
      quantity: 1,
      grossPnl: 500,
      netPnl: 500,
      commission: 0,
      swap: 0,
      fees: 0,
      rMultiple: 2.5,
      roiPercent: 1.0,
      session: 'New York',
      setupType: 'Breakout',
      rating: 5,
      notes: '',
      tags: [],
      mistakes: [],
      rulesFollowed: true,
      durationMinutes: 45,
      entryDate: '2026-03-02T14:00:00Z',
      exitDate: '2026-03-02T14:45:00Z',
    },
  ];

  it('accurately calculates decisive win rate excluding breakevens', () => {
    const metrics = calculateComprehensiveMetrics(mockTrades, { initialBalance: 50000 });
    // Total Closed: 4, Wins: 2, Losses: 1, Breakeven: 1.
    // Decisive Trades: 2 + 1 = 3.
    // Decisive Win Rate: 2 / 3 * 100 = 66.67%
    // All Trades Win Rate: 2 / 4 * 100 = 50.0%
    expect(metrics.totalTrades).toBe(4);
    expect(metrics.closedTrades).toBe(4);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.breakevenTrades).toBe(1);
    expect(metrics.decisiveTrades).toBe(3);
    expect(metrics.winRate).toBe(66.67);
    expect(metrics.allTradesWinRate).toBe(50.0);
    expect(metrics.lossRate).toBe(33.33);
  });

  it('accurately calculates Net PnL and Profit Factor', () => {
    const metrics = calculateComprehensiveMetrics(mockTrades, { initialBalance: 50000 });
    // Gross Profit: 500 + 500 = 1000
    // Gross Loss: 200
    // Net PnL: 800
    // Profit Factor: 1000 / 200 = 5.0
    expect(metrics.grossProfit).toBe(1000);
    expect(metrics.grossLoss).toBe(200);
    expect(metrics.netPnl).toBe(800);
    expect(metrics.profitFactor).toBe(5.0);
  });

  it('handles infinite profit factor when zero losses occur', () => {
    const winOnlyTrades: Trade[] = [
      { id: '1', status: 'CLOSED', netPnl: 300, entryDate: '2026-03-01' } as any,
      { id: '2', status: 'CLOSED', netPnl: 400, entryDate: '2026-03-01' } as any,
    ];
    const metrics = calculateComprehensiveMetrics(winOnlyTrades);
    expect(metrics.profitFactor).toBe(Infinity);
    expect(metrics.winRate).toBe(100);
  });
});

describe('calcEngine: Position Sizing Engine', () => {
  it('calculates correct futures position size on NQ ($5/tick)', () => {
    const result = calculatePositionSize({
      assetClass: 'FUTURES',
      accountBalance: 100000,
      riskPercent: 1.0, // $1,000 risk
      entryPrice: 20000,
      stopLossPrice: 19980, // 20 pts = 80 ticks
      futuresTickSize: 0.25,
      futuresTickValue: 5.0,
    });

    // 20 points * 4 ticks/pt = 80 ticks.
    // Risk per contract = 80 * $5 = $400.
    // Contracts = floor(1000 / 400) = 2 contracts.
    expect(result.riskAmount).toBe(1000);
    expect(result.stopLossTicksOrPips).toBe(80);
    expect(result.positionUnits).toBe(2);
  });

  it('calculates correct forex position size on EUR/USD ($10/pip)', () => {
    const result = calculatePositionSize({
      assetClass: 'FOREX',
      accountBalance: 50000,
      riskPercent: 1.0, // $500 risk
      entryPrice: 1.0850,
      stopLossPrice: 1.0825, // 25 pips
      forexPipSize: 0.0001,
      forexPipValuePerStandardLot: 10.0,
    });

    // 25 pips * $10/pip = $250 risk per lot.
    // Position Units = 500 / 250 = 2.0 standard lots.
    expect(result.riskAmount).toBe(500);
    expect(result.stopLossTicksOrPips).toBe(25);
    expect(result.positionUnits).toBe(2.0);
  });
});

describe('calcEngine: Compounding Simulator', () => {
  it('calculates exact monthly compounded returns', () => {
    const result = calculateCompoundingProjection(10000, 10.0, 3, 0);
    // Month 1: 10,000 + 1,000 = 11,000
    // Month 2: 11,000 + 1,100 = 12,100
    // Month 3: 12,100 + 1,210 = 13,310
    expect(result.finalBalance).toBe(13310);
    expect(result.totalNetProfit).toBe(3310);
    expect(result.totalGrowthPercent).toBe(33.1);
    expect(result.monthlyBreakdown.length).toBe(3);
  });
});
