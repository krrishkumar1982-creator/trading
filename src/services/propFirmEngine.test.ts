import { describe, it, expect } from 'vitest';
import { PropFirmEngine } from './propFirmEngine';
import { PropFirmAccount, Trade } from '../types';

describe('propFirmEngine: Static and Trailing Drawdown Verification', () => {
  it('correctly calculates Static Drawdown (FTMO $100K)', () => {
    const account: PropFirmAccount = {
      id: 'acc-1',
      name: 'FTMO $100K Test',
      firmName: 'FTMO',
      startingBalance: 100000,
      currentBalance: 98000,
      equity: 98000,
      currency: 'USD',
      phase: 'PHASE_1',
      drawdownModel: 'STATIC',
      dailyDrawdownModel: 'START_OF_DAY_BALANCE',
      sessionTimezone: 'UTC',
      status: 'ACTIVE',
      riskState: 'SAFE',
      rules: [
        {
          id: 'rule-max-dd',
          name: 'Max Drawdown',
          type: 'MAX_DRAWDOWN',
          threshold: 10000,
          enabled: true,
          unit: 'USD',
          calculationMethodology: 'Static',
          description: '',
        },
      ],
      violations: [],
      createdAt: '2026-03-01',
    };

    const trades: Trade[] = [
      { id: 't1', status: 'CLOSED', netPnl: -2000, entryDate: '2026-03-01' } as any,
    ];

    const result = PropFirmEngine.calculateMaxDrawdown(account, trades);
    // Drawdown Threshold: 100,000 - 10,000 = $90,000.
    // Current Balance: $98,000.
    // Current Drawdown: 100,000 - 98,000 = $2,000.
    // Buffer Remaining: 98,000 - 90,000 = $8,000.
    // isBreached: false.
    expect(result.drawdownThreshold).toBe(90000);
    expect(result.currentDrawdown).toBe(2000);
    expect(result.bufferRemaining).toBe(8000);
    expect(result.isBreached).toBe(false);
  });

  it('correctly calculates EOD Trailing Drawdown (Topstep $50K)', () => {
    const account: PropFirmAccount = {
      id: 'acc-2',
      name: 'Topstep $50K Test',
      firmName: 'Topstep',
      startingBalance: 50000,
      currentBalance: 52000,
      equity: 52000,
      currency: 'USD',
      phase: 'PHASE_1',
      drawdownModel: 'EOD_TRAILING',
      dailyDrawdownModel: 'START_OF_DAY_BALANCE',
      sessionTimezone: 'America/Chicago',
      status: 'ACTIVE',
      riskState: 'SAFE',
      rules: [
        {
          id: 'rule-max-dd',
          name: 'Max Drawdown',
          type: 'MAX_DRAWDOWN',
          threshold: 2000,
          enabled: true,
          unit: 'USD',
          calculationMethodology: 'EOD Trailing',
          description: '',
        },
      ],
      violations: [],
      createdAt: '2026-03-01',
    };

    // Day 1: +$2,000 profit -> EOD Balance = $52,000. Peak = $52,000.
    // Trailing threshold: 52,000 - 2,000 = $50,000 (locks at 50,100 when peak >= 52,100).
    const trades: Trade[] = [
      { id: 't1', status: 'CLOSED', netPnl: 2000, entryDate: '2026-03-01T15:00:00Z' } as any,
    ];

    const result = PropFirmEngine.calculateMaxDrawdown(account, trades);
    expect(result.drawdownThreshold).toBe(50000);
    expect(result.bufferRemaining).toBe(2000);
    expect(result.isBreached).toBe(false);
  });

  it('triggers breach detection on pre-trade validation when buffer is exceeded', () => {
    const account: PropFirmAccount = {
      id: 'acc-3',
      name: 'Daily Breach Test',
      firmName: 'FTMO',
      startingBalance: 100000,
      currentBalance: 100000,
      equity: 100000,
      currency: 'USD',
      phase: 'PHASE_1',
      drawdownModel: 'STATIC',
      dailyDrawdownModel: 'START_OF_DAY_BALANCE',
      sessionTimezone: 'UTC',
      status: 'ACTIVE',
      riskState: 'SAFE',
      rules: [
        {
          id: 'rule-daily-dd',
          name: 'Daily Loss Limit',
          type: 'DAILY_DRAWDOWN',
          threshold: 5000,
          enabled: true,
          unit: 'USD',
          calculationMethodology: 'Daily Loss Limit',
          description: '',
        },
      ],
      violations: [],
      createdAt: '2026-03-01',
    };

    const trades: Trade[] = [];

    // Attempting a trade risking $6,000 when daily limit is $5,000
    const validation = PropFirmEngine.validatePreTrade(account, trades, {
      symbol: 'NQ',
      direction: 'BUY',
      quantity: 1,
      estimatedRiskDollar: 6000,
    });

    expect(validation.status).toBe('BLOCKED');
  });
});
