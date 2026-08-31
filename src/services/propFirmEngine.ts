import {
  PropFirmAccount,
  PropFirmRule,
  PropFirmViolation,
  PropFirmRiskState,
  Trade,
  PreTradeValidationResult,
  PreTradeValidationCheck,
  PropFirmPhase,
  ProgramModelType,
  DrawdownModelType,
} from '../types';
import { roundMoney, safeAdd, safeSub } from '../lib/calcEngine';

export interface LegionsPreset {
  id: string;
  name: string;
  firmName: string;
  legalEntity: string;
  tradingBrand: string;
  registrationNumber: string;
  jurisdiction: string;
  termsEffectiveDate: string;
  rulesVersion: string;
  programModel: ProgramModelType;
  phase: PropFirmPhase;
  startingBalance: number;
  currency: string;
  profitTargetPercent: number;
  dailyLossPercent: number;
  totalLossPercent: number;
  drawdownModel: DrawdownModelType;
  dailyLossMethod: 'REALIZED_ONLY' | 'REALIZED_PLUS_FLOATING' | 'START_OF_DAY_EQUITY' | 'START_OF_DAY_BALANCE' | 'CUSTOM';
  maxRiskPerSymbolPercent?: number;
  minTradeDurationSec?: number;
  avgTradeDurationSec?: number;
  minTradingDays?: number;
  qualifyingDayProfitPercent?: number;
  consistencyMaxDayPercent?: number;
  rewardBufferPercent?: number;
  rewardSplitPercent: number;
  activationFee?: number;
  rules: Omit<PropFirmRule, 'currentValue' | 'status'>[];
}

/**
 * LegionFunding Official Presets
 */
export const LEGION_FUNDING_PRESETS: LegionsPreset[] = [
  // 1. Two-Step Model: Phase 1
  {
    id: 'legion-2step-p1-50k',
    name: 'LegionFunding 50K Two-Step (Phase 1)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'TWO_STEP',
    phase: 'PHASE_1',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 8,
    dailyLossPercent: 4,
    totalLossPercent: 10,
    drawdownModel: 'STATIC',
    dailyLossMethod: 'REALIZED_ONLY',
    minTradingDays: 3,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-2p1-target',
        name: 'Profit Target (8%)',
        type: 'PROFIT_TARGET',
        description: 'Achieve 8% profit ($4,000 on $50,000) on closed trades.',
        enabled: true,
        threshold: 4000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance × 8%',
      },
      {
        id: 'legion-2p1-daily',
        name: 'Daily Loss Limit (4%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 4% ($2,000 on $50,000) of starting balance.',
        enabled: true,
        threshold: 2000,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 4%',
        warningThreshold: 1400,
        criticalThreshold: 1800,
      },
      {
        id: 'legion-2p1-total',
        name: 'Total Loss Limit (10%)',
        type: 'MAX_DRAWDOWN',
        description: 'Static total loss limit 10% ($5,000 on $50,000). Account balance/equity must not drop below $45,000.',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance − $5,000',
        warningThreshold: 3500,
        criticalThreshold: 4500,
      },
      {
        id: 'legion-2p1-days',
        name: 'Minimum Trading Days (3 Days)',
        type: 'MIN_TRADING_DAYS',
        description: 'Execute trades on at least 3 distinct trading days.',
        enabled: true,
        threshold: 3,
        unit: 'DAYS',
        calculationMethodology: 'Count of unique active dates with trades',
      },
      {
        id: 'legion-2p1-qual',
        name: 'Qualifying Day Requirement (0.5%)',
        type: 'QUALIFYING_DAY',
        description: 'A qualifying trading day requires at least 0.5% realized profit ($250 on $50K).',
        enabled: true,
        threshold: 0.5,
        unit: 'PERCENT',
        calculationMethodology: 'Daily Realized Net P&L >= Starting Balance × 0.5%',
      },
    ],
  },

  // 2. Two-Step Model: Phase 2
  {
    id: 'legion-2step-p2-50k',
    name: 'LegionFunding 50K Two-Step (Phase 2)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'TWO_STEP',
    phase: 'PHASE_2',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 5,
    dailyLossPercent: 4,
    totalLossPercent: 10,
    drawdownModel: 'STATIC',
    dailyLossMethod: 'REALIZED_ONLY',
    minTradingDays: 3,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-2p2-target',
        name: 'Profit Target (5%)',
        type: 'PROFIT_TARGET',
        description: 'Achieve 5% profit ($2,500 on $50,000) on closed trades.',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Starting Balance × 5%',
      },
      {
        id: 'legion-2p2-daily',
        name: 'Daily Loss Limit (4%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 4% ($2,000 on $50,000) of starting balance.',
        enabled: true,
        threshold: 2000,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 4%',
        warningThreshold: 1400,
        criticalThreshold: 1800,
      },
      {
        id: 'legion-2p2-total',
        name: 'Total Loss Limit (10%)',
        type: 'MAX_DRAWDOWN',
        description: 'Static total loss limit 10% ($5,000 on $50,000).',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance − $5,000',
        warningThreshold: 3500,
        criticalThreshold: 4500,
      },
      {
        id: 'legion-2p2-days',
        name: 'Minimum Trading Days (3 Days)',
        type: 'MIN_TRADING_DAYS',
        description: 'Execute trades on at least 3 distinct trading days.',
        enabled: true,
        threshold: 3,
        unit: 'DAYS',
        calculationMethodology: 'Count of unique active dates with trades',
      },
      {
        id: 'legion-2p2-qual',
        name: 'Qualifying Day Requirement (0.5%)',
        type: 'QUALIFYING_DAY',
        description: 'A qualifying trading day requires at least 0.5% realized profit ($250 on $50K).',
        enabled: true,
        threshold: 0.5,
        unit: 'PERCENT',
        calculationMethodology: 'Daily Realized Net P&L >= Starting Balance × 0.5%',
      },
    ],
  },

  // 3. Two-Step Model: Simulated Funded
  {
    id: 'legion-2step-funded-50k',
    name: 'LegionFunding 50K Two-Step (Simulated Funded)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'TWO_STEP',
    phase: 'SIMULATED_FUNDED',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 0,
    dailyLossPercent: 4,
    totalLossPercent: 10,
    drawdownModel: 'STATIC',
    dailyLossMethod: 'REALIZED_ONLY',
    maxRiskPerSymbolPercent: 2,
    minTradeDurationSec: 60,
    minTradingDays: 5,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-2sf-daily',
        name: 'Daily Loss Limit (4%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 4% ($2,000 on $50,000).',
        enabled: true,
        threshold: 2000,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 4%',
      },
      {
        id: 'legion-2sf-total',
        name: 'Total Loss Limit (10%)',
        type: 'MAX_DRAWDOWN',
        description: 'Static total loss limit 10% ($5,000 on $50,000).',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance − $5,000',
      },
      {
        id: 'legion-2sf-symbol',
        name: 'Max Risk Per Symbol (2%)',
        type: 'SYMBOL_EXPOSURE_RISK',
        description: 'Combined open/closed risk exposure on a single symbol must not exceed 2% ($1,000).',
        enabled: true,
        threshold: 1000,
        unit: 'USD',
        calculationMethodology: 'Aggregate potential risk per symbol <= Starting Balance × 2%',
      },
      {
        id: 'legion-2sf-duration',
        name: 'Minimum Trade Duration (1 Min)',
        type: 'MIN_TRADE_DURATION',
        description: 'Positions must be held open for at least 60 seconds.',
        enabled: true,
        threshold: 60,
        unit: 'SECONDS',
        calculationMethodology: 'Trade Exit Time − Entry Time >= 60 seconds',
      },
      {
        id: 'legion-2sf-days',
        name: 'Minimum Trading Days (5 Days)',
        type: 'MIN_TRADING_DAYS',
        description: 'Must complete at least 5 trading days before first reward request.',
        enabled: true,
        threshold: 5,
        unit: 'DAYS',
        calculationMethodology: 'Count of active trading days',
      },
    ],
  },

  // 4. One-Step Model: Evaluation
  {
    id: 'legion-1step-eval-50k',
    name: 'LegionFunding 50K One-Step (Evaluation)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'ONE_STEP',
    phase: 'EVALUATION',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 10,
    dailyLossPercent: 3,
    totalLossPercent: 6,
    drawdownModel: 'EOD_TRAILING',
    dailyLossMethod: 'REALIZED_ONLY',
    minTradingDays: 4,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-1eval-target',
        name: 'Profit Target (10%)',
        type: 'PROFIT_TARGET',
        description: 'Achieve 10% profit ($5,000 on $50,000).',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance × 10%',
      },
      {
        id: 'legion-1eval-daily',
        name: 'Daily Loss Limit (3%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 3% ($1,500 on $50,000).',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 3%',
      },
      {
        id: 'legion-1eval-total',
        name: 'Trailing Total Loss Limit (6%)',
        type: 'MAX_DRAWDOWN',
        description: 'Trailing total drawdown 6% ($3,000 on $50,000) from peak high-water mark.',
        enabled: true,
        threshold: 3000,
        unit: 'USD',
        calculationMethodology: 'Peak Balance − $3,000',
      },
      {
        id: 'legion-1eval-days',
        name: 'Minimum Trading Days (4 Days)',
        type: 'MIN_TRADING_DAYS',
        description: 'Must complete at least 4 active trading days.',
        enabled: true,
        threshold: 4,
        unit: 'DAYS',
        calculationMethodology: 'Count of unique trading dates',
      },
    ],
  },

  // 5. One-Step Model: Funded
  {
    id: 'legion-1step-funded-50k',
    name: 'LegionFunding 50K One-Step (Funded)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'ONE_STEP',
    phase: 'FUNDED',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 0,
    dailyLossPercent: 3,
    totalLossPercent: 6,
    drawdownModel: 'EOD_TRAILING',
    dailyLossMethod: 'REALIZED_ONLY',
    maxRiskPerSymbolPercent: 1,
    minTradingDays: 5,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-1fun-daily',
        name: 'Daily Loss Limit (3%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 3% ($1,500 on $50,000).',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 3%',
      },
      {
        id: 'legion-1fun-total',
        name: 'Trailing Loss Limit (6%)',
        type: 'MAX_DRAWDOWN',
        description: 'Trailing total drawdown 6% ($3,000 on $50,000).',
        enabled: true,
        threshold: 3000,
        unit: 'USD',
        calculationMethodology: 'Peak Balance − $3,000',
      },
      {
        id: 'legion-1fun-symbol',
        name: 'Max Risk Per Symbol (1%)',
        type: 'SYMBOL_EXPOSURE_RISK',
        description: 'Max risk per symbol 1% ($500 on $50,000).',
        enabled: true,
        threshold: 500,
        unit: 'USD',
        calculationMethodology: 'Aggregate potential risk per symbol <= Starting Balance × 1%',
      },
      {
        id: 'legion-1fun-days',
        name: 'Minimum Trading Days (5 Days)',
        type: 'MIN_TRADING_DAYS',
        description: 'Must complete at least 5 active trading days.',
        enabled: true,
        threshold: 5,
        unit: 'DAYS',
        calculationMethodology: 'Count of unique active dates',
      },
    ],
  },

  // 6. Instant Funding Model
  {
    id: 'legion-instant-funded-50k',
    name: 'LegionFunding 50K Instant Funding (Funded)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'INSTANT_FUNDING',
    phase: 'FUNDED',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 0,
    dailyLossPercent: 3,
    totalLossPercent: 5,
    drawdownModel: 'EOD_TRAILING',
    dailyLossMethod: 'REALIZED_ONLY',
    consistencyMaxDayPercent: 20,
    maxRiskPerSymbolPercent: 2,
    rewardBufferPercent: 3,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-inst-daily',
        name: 'Daily Loss Limit (3%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 3% ($1,500 on $50,000).',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 3%',
      },
      {
        id: 'legion-inst-total',
        name: 'Trailing Loss Limit (5%)',
        type: 'MAX_DRAWDOWN',
        description: 'Trailing total loss limit 5% ($2,500 on $50,000).',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Peak Balance − $2,500',
      },
      {
        id: 'legion-inst-consistency',
        name: 'Consistency Rule (20%)',
        type: 'CONSISTENCY',
        description: 'No single day profit may exceed 20% of total accumulated eligible profit.',
        enabled: true,
        threshold: 20,
        unit: 'PERCENT',
        calculationMethodology: '(Highest Day Profit / Total Eligible Profit) × 100 <= 20%',
      },
      {
        id: 'legion-inst-symbol',
        name: 'Max Risk Per Symbol (2%)',
        type: 'SYMBOL_EXPOSURE_RISK',
        description: 'Max risk per symbol 2% ($1,000 on $50,000).',
        enabled: true,
        threshold: 1000,
        unit: 'USD',
        calculationMethodology: 'Aggregate potential risk per symbol <= Starting Balance × 2%',
      },
      {
        id: 'legion-inst-buffer',
        name: 'Reward Buffer (3%)',
        type: 'REWARD_BUFFER',
        description: 'Must hold a 3% profit buffer ($1,500) above initial balance before first payout.',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Realized Net Profit >= Starting Balance × 3%',
      },
    ],
  },

  // 7. Fast Track Model
  {
    id: 'legion-fasttrack-eval-50k',
    name: 'LegionFunding 50K Fast Track (Evaluation)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'FAST_TRACK',
    phase: 'EVALUATION',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 6,
    dailyLossPercent: 3,
    totalLossPercent: 5,
    drawdownModel: 'EOD_TRAILING',
    dailyLossMethod: 'REALIZED_ONLY',
    minTradingDays: 0,
    activationFee: 350, // $350 for 50k
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-ft-target',
        name: 'Fast Track Target (6%)',
        type: 'PROFIT_TARGET',
        description: 'Achieve 6% profit target ($3,000 on $50,000).',
        enabled: true,
        threshold: 3000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance × 6%',
      },
      {
        id: 'legion-ft-daily',
        name: 'Daily Loss Limit (3%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 3% ($1,500 on $50,000).',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 3%',
      },
      {
        id: 'legion-ft-total',
        name: 'Trailing Loss Limit (5%)',
        type: 'MAX_DRAWDOWN',
        description: 'Trailing total loss limit 5% ($2,500 on $50,000).',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Peak Balance − $2,500',
      },
    ],
  },

  // 8. Fast Track Model: Simulated Funded
  {
    id: 'legion-fasttrack-funded-50k',
    name: 'LegionFunding 50K Fast Track (Simulated Funded)',
    firmName: 'LegionFunding',
    legalEntity: 'Hyper Funded Ltd.',
    tradingBrand: 'LegionFunding',
    registrationNumber: '2026-00324',
    jurisdiction: 'Saint Lucia',
    termsEffectiveDate: '2026-07-01',
    rulesVersion: 'v1.0',
    programModel: 'FAST_TRACK',
    phase: 'SIMULATED_FUNDED',
    startingBalance: 50000,
    currency: 'USD',
    profitTargetPercent: 0,
    dailyLossPercent: 3,
    totalLossPercent: 5,
    drawdownModel: 'EOD_TRAILING',
    dailyLossMethod: 'REALIZED_ONLY',
    consistencyMaxDayPercent: 20,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'legion-ftf-daily',
        name: 'Daily Loss Limit (3%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 3% ($1,500 on $50,000).',
        enabled: true,
        threshold: 1500,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 3%',
      },
      {
        id: 'legion-ftf-total',
        name: 'Trailing Loss Limit (5%)',
        type: 'MAX_DRAWDOWN',
        description: 'Trailing total loss limit 5% ($2,500 on $50,000).',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Peak Balance − $2,500',
      },
      {
        id: 'legion-ftf-consistency',
        name: 'Consistency Rule (20%)',
        type: 'CONSISTENCY',
        description: 'No single day profit may exceed 20% of total accumulated profit.',
        enabled: true,
        threshold: 20,
        unit: 'PERCENT',
        calculationMethodology: 'Highest Day Profit / Total Profit <= 20%',
      },
    ],
  },

  // 9. Generic Custom Model Preset
  {
    id: 'template-custom-25k',
    name: 'Custom Prop Firm $25K Setup',
    firmName: 'Custom Firm',
    legalEntity: 'Trader Custom LLC',
    tradingBrand: 'Custom Prop',
    registrationNumber: 'CUSTOM-001',
    jurisdiction: 'United States',
    termsEffectiveDate: new Date().toISOString().split('T')[0],
    rulesVersion: 'v1.0',
    programModel: 'CUSTOM',
    phase: 'CUSTOM',
    startingBalance: 25000,
    currency: 'USD',
    profitTargetPercent: 10,
    dailyLossPercent: 5,
    totalLossPercent: 10,
    drawdownModel: 'STATIC',
    dailyLossMethod: 'REALIZED_ONLY',
    minTradingDays: 5,
    qualifyingDayProfitPercent: 0.5,
    rewardSplitPercent: 80,
    rules: [
      {
        id: 'custom-daily',
        name: 'Daily Loss Limit (5%)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 5% ($1,250 on $25,000).',
        enabled: true,
        threshold: 1250,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 5%',
      },
      {
        id: 'custom-total',
        name: 'Total Drawdown Limit (10%)',
        type: 'MAX_DRAWDOWN',
        description: 'Static total loss limit 10% ($2,500 on $25,000).',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Starting Balance − $2,500',
      },
      {
        id: 'custom-target',
        name: 'Profit Target (10%)',
        type: 'PROFIT_TARGET',
        description: '10% profit target ($2,500 on $25,000).',
        enabled: true,
        threshold: 2500,
        unit: 'USD',
        calculationMethodology: 'Starting Balance × 10%',
      },
    ],
  },
];

export const PROP_FIRM_TEMPLATES = LEGION_FUNDING_PRESETS;

export function createAccountFromPreset(
  preset: LegionsPreset,
  customBalance?: number,
  customName?: string,
  tradingAccountLink?: string
): PropFirmAccount {
  const startingBalance = customBalance && customBalance > 0 ? customBalance : preset.startingBalance;

  const profitTargetAmount = preset.profitTargetPercent > 0 ? roundMoney(startingBalance * (preset.profitTargetPercent / 100)) : 0;
  const dailyLossAmount = roundMoney(startingBalance * (preset.dailyLossPercent / 100));
  const totalLossAmount = roundMoney(startingBalance * (preset.totalLossPercent / 100));
  const maxRiskSymbolAmount = preset.maxRiskPerSymbolPercent ? roundMoney(startingBalance * (preset.maxRiskPerSymbolPercent / 100)) : undefined;
  const rewardBufferAmount = preset.rewardBufferPercent ? roundMoney(startingBalance * (preset.rewardBufferPercent / 100)) : 0;
  const qualifyingDayAmount = preset.qualifyingDayProfitPercent ? roundMoney(startingBalance * (preset.qualifyingDayProfitPercent / 100)) : 0;

  const rules: PropFirmRule[] = preset.rules.map((r, idx) => {
    let newThreshold = r.threshold;
    let description = r.description;

    if (r.type === 'PROFIT_TARGET') {
      newThreshold = profitTargetAmount;
      description = `Achieve ${preset.profitTargetPercent}% profit ($${profitTargetAmount.toLocaleString()} on $${startingBalance.toLocaleString()}).`;
    } else if (r.type === 'DAILY_DRAWDOWN') {
      newThreshold = dailyLossAmount;
      description = `Daily loss limit ${preset.dailyLossPercent}% ($${dailyLossAmount.toLocaleString()} on $${startingBalance.toLocaleString()}).`;
    } else if (r.type === 'MAX_DRAWDOWN') {
      newThreshold = totalLossAmount;
      description = `${preset.drawdownModel === 'INTRADAY_HWM_TRAILING' ? 'Trailing' : 'Static'} total loss limit ${preset.totalLossPercent}% ($${totalLossAmount.toLocaleString()} on $${startingBalance.toLocaleString()}).`;
    } else if (r.type === 'SYMBOL_EXPOSURE_RISK' && preset.maxRiskPerSymbolPercent) {
      newThreshold = maxRiskSymbolAmount!;
      description = `Max risk per symbol ${preset.maxRiskPerSymbolPercent}% ($${maxRiskSymbolAmount!.toLocaleString()} on $${startingBalance.toLocaleString()}).`;
    } else if (r.type === 'REWARD_BUFFER' && preset.rewardBufferPercent) {
      newThreshold = rewardBufferAmount;
      description = `Must hold a ${preset.rewardBufferPercent}% profit buffer ($${rewardBufferAmount.toLocaleString()}) above initial balance before first payout.`;
    } else if (r.type === 'QUALIFYING_DAY' && preset.qualifyingDayProfitPercent) {
      newThreshold = preset.qualifyingDayProfitPercent;
      description = `A qualifying trading day requires at least ${preset.qualifyingDayProfitPercent}% realized profit ($${qualifyingDayAmount.toLocaleString()} on $${startingBalance.toLocaleString()}).`;
    }

    return {
      ...r,
      id: `r-${Date.now()}-${idx}`,
      threshold: newThreshold,
      description,
      warningThreshold: r.warningThreshold ? roundMoney(newThreshold * 0.7) : undefined,
      criticalThreshold: r.criticalThreshold ? roundMoney(newThreshold * 0.9) : undefined,
    };
  });

  const formattedK = startingBalance >= 1000 ? `${(startingBalance / 1000).toLocaleString()}K` : startingBalance.toString();
  const name = customName || `${preset.firmName} $${formattedK} ${preset.name.replace(/^LegionFunding \d+K\s*/, '')}`;

  return {
    id: `pf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    name,
    firmName: preset.firmName,
    legalEntity: preset.legalEntity,
    tradingBrand: preset.tradingBrand,
    registrationNumber: preset.registrationNumber,
    jurisdiction: preset.jurisdiction,
    termsEffectiveDate: preset.termsEffectiveDate,
    rulesVersion: preset.rulesVersion,
    startingBalance,
    currentBalance: startingBalance,
    equity: startingBalance,
    programModel: preset.programModel,
    phase: preset.phase,
    status: 'ACTIVE',
    riskState: 'SAFE',
    enforcementMode: 'MONITOR',
    drawdownModel: preset.drawdownModel,
    dailyDrawdownModel: 'START_OF_DAY_BALANCE',
    dailyLossMethod: preset.dailyLossMethod,
    profitTargetPercent: preset.profitTargetPercent,
    dailyLossPercent: preset.dailyLossPercent,
    totalLossPercent: preset.totalLossPercent,
    maxRiskPerSymbolPercent: preset.maxRiskPerSymbolPercent,
    minTradeDurationSec: preset.minTradeDurationSec,
    minTradingDays: preset.minTradingDays,
    qualifyingDayProfitPercent: preset.qualifyingDayProfitPercent,
    consistencyMaxDayPercent: preset.consistencyMaxDayPercent,
    rewardBufferPercent: preset.rewardBufferPercent || 0,
    rewardSplitPercent: preset.rewardSplitPercent,
    sessionTimezone: 'America/New_York',
    currency: preset.currency || 'USD',
    tradingAccountLink: tradingAccountLink || 'all',
    rules,
    violations: [],
    payoutInfo: {
      minTradingDaysRequired: preset.minTradingDays || 0,
      tradingDaysCompleted: 0,
      profitSplitPercent: preset.rewardSplitPercent,
      eligibleProfit: 0,
      payoutAmount: 0,
      minRequestAmount: 100,
      rewardBufferPercent: preset.rewardBufferPercent || 0,
      rewardBufferMet: preset.rewardBufferPercent ? false : true,
      payoutHistory: [],
    },
  };
}

/**
 * Institutional Prop Firm Engine
 */
export class PropFirmEngine {
  /**
   * Calculate session trading date in designated timezone
   */
  static getSessionTradingDate(isoString: string, _timezone: string = 'America/New_York'): string {
    if (!isoString) return new Date().toISOString().split('T')[0];
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString.split('T')[0];
      return d.toISOString().split('T')[0];
    } catch {
      return isoString.split('T')[0];
    }
  }

  /**
   * Group trades by trading day according to account session boundary
   */
  static groupTradesByTradingDay(trades: Trade[], timezone: string): Record<string, { trades: Trade[]; netPnl: number }> {
    const map: Record<string, { trades: Trade[]; netPnl: number }> = {};
    trades.forEach((t) => {
      if (t.status !== 'CLOSED') return;
      const day = this.getSessionTradingDate(t.entryDate || t.exitDate || '', timezone);
      if (!map[day]) {
        map[day] = { trades: [], netPnl: 0 };
      }
      map[day].trades.push(t);
      map[day].netPnl = safeAdd(map[day].netPnl, t.netPnl || 0);
    });
    return map;
  }

  /**
   * Dynamic Threshold Helper: Convert % to exact dollar value based on account starting balance
   */
  static getDynamicThreshold(account: PropFirmAccount, ruleType: string, defaultPercent: number): number {
    const rule = account.rules.find((r) => r.type === ruleType && r.enabled);
    if (!rule) return roundMoney(account.startingBalance * (defaultPercent / 100), 2);
    if (rule.unit === 'PERCENT') {
      return roundMoney(account.startingBalance * (rule.threshold / 100), 2);
    }
    return rule.threshold;
  }

  /**
   * Calculate exact drawdown based on chosen model (Static, EOD Trailing, Intraday HWM Trailing)
   */
  static calculateMaxDrawdown(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    currentDrawdown: number;
    peakEquity: number;
    drawdownThreshold: number;
    bufferRemaining: number;
    bufferPercent: number;
    isBreached: boolean;
  } {
    const initial = account.startingBalance;
    const maxLossThreshold = this.getDynamicThreshold(account, 'MAX_DRAWDOWN', account.totalLossPercent || 10);

    // Chronologically sort closed trades
    const sortedTrades = [...trades]
      .filter((t) => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let runningBalance = initial;
    let peakBalance = initial;

    // Track daily closes for EOD model
    const dailyMap = this.groupTradesByTradingDay(sortedTrades, account.sessionTimezone);
    const dailyKeys = Object.keys(dailyMap).sort();

    let eodPeak = initial;
    let eodBalance = initial;
    dailyKeys.forEach((key) => {
      eodBalance = safeAdd(eodBalance, dailyMap[key].netPnl);
      if (eodBalance > eodPeak) eodPeak = eodBalance;
    });

    sortedTrades.forEach((t) => {
      runningBalance = safeAdd(runningBalance, t.netPnl || 0);
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
    });

    const peakEquity = Math.max(peakBalance, account.highWaterMark || initial, account.currentBalance);

    let currentDrawdown = 0;
    let drawdownThreshold = 0;

    switch (account.drawdownModel) {
      case 'STATIC': {
        drawdownThreshold = roundMoney(initial - maxLossThreshold, 2);
        currentDrawdown = Math.max(0, roundMoney(initial - account.currentBalance, 2));
        break;
      }
      case 'EOD_TRAILING': {
        const lockInLevel = initial + 100;
        const rawThreshold = roundMoney(eodPeak - maxLossThreshold, 2);
        drawdownThreshold = Math.min(rawThreshold, lockInLevel);
        currentDrawdown = Math.max(0, roundMoney(eodPeak - account.currentBalance, 2));
        break;
      }
      case 'INTRADAY_HWM_TRAILING': {
        const lockInLevel = initial + 100;
        const rawThreshold = roundMoney(peakEquity - maxLossThreshold, 2);
        drawdownThreshold = Math.min(rawThreshold, lockInLevel);
        currentDrawdown = Math.max(0, roundMoney(peakEquity - account.currentBalance, 2));
        break;
      }
      default:
        drawdownThreshold = roundMoney(initial - maxLossThreshold, 2);
        currentDrawdown = Math.max(0, roundMoney(initial - account.currentBalance, 2));
    }

    const bufferRemaining = Math.max(0, roundMoney(account.currentBalance - drawdownThreshold, 2));
    const bufferPercent = maxLossThreshold > 0 ? roundMoney((bufferRemaining / maxLossThreshold) * 100, 2) : 100;
    const isBreached = account.currentBalance <= drawdownThreshold;

    return {
      currentDrawdown: roundMoney(currentDrawdown, 2),
      peakEquity: roundMoney(peakEquity, 2),
      drawdownThreshold: roundMoney(drawdownThreshold, 2),
      bufferRemaining: roundMoney(bufferRemaining, 2),
      bufferPercent: Math.min(100, Math.max(0, bufferPercent)),
      isBreached,
    };
  }

  /**
   * Calculate daily drawdown & session loss
   */
  static calculateDailyDrawdown(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    todayLoss: number;
    todayNetPnl: number;
    dailyLimit: number;
    remainingDailyBuffer: number;
    remainingDailyBufferPercent: number;
    startOfDayReference: number;
    isBreached: boolean;
  } {
    const dailyLimit = this.getDynamicThreshold(account, 'DAILY_DRAWDOWN', account.dailyLossPercent || 4);

    const todayStr = this.getSessionTradingDate(new Date().toISOString(), account.sessionTimezone);
    const dailyGroups = this.groupTradesByTradingDay(trades, account.sessionTimezone);
    const todayGroup = dailyGroups[todayStr] || { trades: [], netPnl: 0 };

    const todayNetPnl = roundMoney(todayGroup.netPnl, 2);
    const todayLoss = todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0;

    const startOfDayReference = roundMoney(account.currentBalance - todayNetPnl, 2);
    const remainingDailyBuffer = Math.max(0, roundMoney(dailyLimit - todayLoss, 2));
    const remainingDailyBufferPercent = dailyLimit > 0 ? roundMoney((remainingDailyBuffer / dailyLimit) * 100, 2) : 100;
    const isBreached = todayLoss >= dailyLimit;

    return {
      todayLoss: roundMoney(todayLoss, 2),
      todayNetPnl: roundMoney(todayNetPnl, 2),
      dailyLimit: roundMoney(dailyLimit, 2),
      remainingDailyBuffer: roundMoney(remainingDailyBuffer, 2),
      remainingDailyBufferPercent: Math.min(100, Math.max(0, remainingDailyBufferPercent)),
      startOfDayReference,
      isBreached,
    };
  }

  /**
   * Calculate Profit Target Progress
   */
  static calculateProfitTarget(
    account: PropFirmAccount
  ): {
    target: number;
    currentProfit: number;
    profitPercent: number;
    progressPercent: number;
    remainingProfit: number;
    isPassed: boolean;
  } {
    const target = this.getDynamicThreshold(account, 'PROFIT_TARGET', account.profitTargetPercent || 8);
    const currentProfit = roundMoney(account.currentBalance - account.startingBalance, 2);
    const profitPercent = account.startingBalance > 0 ? roundMoney((currentProfit / account.startingBalance) * 100, 2) : 0;
    const progressPercent = target > 0 ? Math.min(100, Math.max(0, roundMoney((currentProfit / target) * 100, 1))) : 0;
    const remainingProfit = Math.max(0, roundMoney(target - currentProfit, 2));
    const isPassed = currentProfit >= target;

    return {
      target: roundMoney(target, 2),
      currentProfit,
      profitPercent,
      progressPercent,
      remainingProfit,
      isPassed,
    };
  }

  /**
   * Calculate Minimum Trading Days & Qualifying Days
   */
  static calculateTradingDays(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    minDaysRequired: number;
    daysCompleted: number;
    qualifyingDaysCompleted: number;
    qualifyingDayThresholdDollar: number;
    daysRemaining: number;
    dailyBreakdown: Array<{ date: string; netPnl: number; isQualifying: boolean }>;
    isSatisfied: boolean;
  } {
    const daysRule = account.rules.find((r) => r.type === 'MIN_TRADING_DAYS' && r.enabled);
    const minDaysRequired = daysRule ? daysRule.threshold : account.minTradingDays ?? 3;

    const qualPercent = account.qualifyingDayProfitPercent ?? 0.5;
    const qualifyingDayThresholdDollar = roundMoney(account.startingBalance * (qualPercent / 100), 2);

    const dailyGroups = this.groupTradesByTradingDay(trades, account.sessionTimezone);
    const dates = Object.keys(dailyGroups).sort();

    let qualifyingDaysCount = 0;
    const dailyBreakdown = dates.map((d) => {
      const pnl = roundMoney(dailyGroups[d].netPnl, 2);
      const isQualifying = pnl >= qualifyingDayThresholdDollar;
      if (isQualifying) qualifyingDaysCount++;
      return { date: d, netPnl: pnl, isQualifying };
    });

    const daysCompleted = dates.length;
    const daysRemaining = Math.max(0, minDaysRequired - daysCompleted);
    const isSatisfied = daysCompleted >= minDaysRequired;

    return {
      minDaysRequired,
      daysCompleted,
      qualifyingDaysCompleted: qualifyingDaysCount,
      qualifyingDayThresholdDollar,
      daysRemaining,
      dailyBreakdown,
      isSatisfied,
    };
  }

  /**
   * Calculate Risk Exposure Per Symbol
   */
  static calculateSymbolRiskExposure(
    account: PropFirmAccount,
    trades: Trade[]
  ): Array<{
    symbol: string;
    totalTradesCount: number;
    realizedPnl: number;
    potentialRiskDollar: number;
    maxAllowedRiskDollar: number;
    remainingAllowedRisk: number;
    status: 'SAFE' | 'WARNING' | 'BREACHED';
  }> {
    const maxRiskPercent = account.maxRiskPerSymbolPercent || 2;
    const maxAllowedRiskDollar = roundMoney(account.startingBalance * (maxRiskPercent / 100), 2);

    const symbolMap: Record<string, { count: number; pnl: number; potentialRisk: number }> = {};

    trades.forEach((t) => {
      if (!symbolMap[t.symbol]) {
        symbolMap[t.symbol] = { count: 0, pnl: 0, potentialRisk: 0 };
      }
      symbolMap[t.symbol].count++;
      symbolMap[t.symbol].pnl = safeAdd(symbolMap[t.symbol].pnl, t.netPnl || 0);

      // Estimated SL risk calculation if open/closed position has SL defined
      let tradeRisk = 0;
      if (t.stopLoss && t.entryPrice) {
        tradeRisk = Math.abs(t.entryPrice - t.stopLoss) * (t.quantity || 1) * 20; // fallback multiplier
      } else if (t.netPnl < 0) {
        tradeRisk = Math.abs(t.netPnl);
      }
      symbolMap[t.symbol].potentialRisk = Math.max(symbolMap[t.symbol].potentialRisk, tradeRisk);
    });

    return Object.keys(symbolMap).map((sym) => {
      const data = symbolMap[sym];
      const risk = roundMoney(data.potentialRisk, 2);
      const remaining = Math.max(0, roundMoney(maxAllowedRiskDollar - risk, 2));
      const status: 'SAFE' | 'WARNING' | 'BREACHED' =
        risk > maxAllowedRiskDollar ? 'BREACHED' : risk >= maxAllowedRiskDollar * 0.8 ? 'WARNING' : 'SAFE';

      return {
        symbol: sym,
        totalTradesCount: data.count,
        realizedPnl: roundMoney(data.pnl, 2),
        potentialRiskDollar: risk,
        maxAllowedRiskDollar,
        remainingAllowedRisk: remaining,
        status,
      };
    });
  }

  /**
   * Calculate Minimum Trade Duration vs Average Trade Duration
   */
  static calculateTradeDurations(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    minRequiredSec: number;
    avgTradeDurationSec: number;
    durationBreachesCount: number;
    compliantTradesCount: number;
    totalCheckedTrades: number;
    details: Array<{ tradeId: string; symbol: string; durationSec: number; durationText: string; isCompliant: boolean }>;
  } {
    const minRequiredSec = account.minTradeDurationSec || 60;
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    let totalSec = 0;
    let breachesCount = 0;
    let compliantCount = 0;

    const details = closedTrades.map((t) => {
      const mins = t.durationMinutes || 1;
      const sec = Math.round(mins * 60);
      totalSec += sec;

      const isCompliant = sec >= minRequiredSec;
      if (isCompliant) compliantCount++;
      else breachesCount++;

      const durationText = `${Math.floor(sec / 60)}m ${sec % 60}s`;
      return { tradeId: t.id, symbol: t.symbol, durationSec: sec, durationText, isCompliant };
    });

    const avgTradeDurationSec = closedTrades.length > 0 ? Math.round(totalSec / closedTrades.length) : 0;

    return {
      minRequiredSec,
      avgTradeDurationSec,
      durationBreachesCount: breachesCount,
      compliantTradesCount: compliantCount,
      totalCheckedTrades: closedTrades.length,
      details,
    };
  }

  /**
   * Calculate Consistency Metric (20% for Instant & Fast Track)
   */
  static calculateConsistency(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    bestDayProfit: number;
    totalProfit: number;
    consistencyPercent: number;
    allowedPercent: number;
    additionalProfitNeeded: number;
    marginRemaining: number;
    isCompliant: boolean;
  } {
    const consistencyRule = account.rules.find((r) => r.type === 'CONSISTENCY' && r.enabled);
    const allowedPercent = consistencyRule ? consistencyRule.threshold : account.consistencyMaxDayPercent || 20;

    const dailyGroups = this.groupTradesByTradingDay(trades, account.sessionTimezone);
    let bestDayProfit = 0;
    let totalPositiveProfit = 0;

    Object.values(dailyGroups).forEach((g) => {
      if (g.netPnl > 0) {
        totalPositiveProfit = safeAdd(totalPositiveProfit, g.netPnl);
        if (g.netPnl > bestDayProfit) {
          bestDayProfit = g.netPnl;
        }
      }
    });

    const consistencyPercent =
      totalPositiveProfit > 0 ? Math.round((bestDayProfit / totalPositiveProfit) * 100) : 0;
    const marginRemaining = Math.max(0, allowedPercent - consistencyPercent);
    const isCompliant = consistencyPercent <= allowedPercent;

    // Additional profit required to bring best day under consistency cap
    const requiredTotalProfit = bestDayProfit / (allowedPercent / 100);
    const additionalProfitNeeded = Math.max(0, roundMoney(requiredTotalProfit - totalPositiveProfit, 2));

    return {
      bestDayProfit: roundMoney(bestDayProfit, 2),
      totalProfit: roundMoney(totalPositiveProfit, 2),
      consistencyPercent,
      allowedPercent,
      additionalProfitNeeded,
      marginRemaining,
      isCompliant,
    };
  }

  /**
   * News Trading Rule Window Evaluation (5 mins before + 5 mins after High Impact news)
   */
  static calculateNewsCompliance(
    account: PropFirmAccount,
    trades: Trade[],
    newsEvents: Array<{ time: string; date: string; impact: string; event: string }>
  ): {
    restrictedWindowMinutes: number;
    violatingTradesCount: number;
    compliantTradesCount: number;
    newsAuditLogs: Array<{ tradeId: string; symbol: string; entryTime: string; eventName: string; isViolating: boolean }>;
  } {
    const windowMins = account.newsWindowMinutes || 5;
    const highImpactNews = newsEvents.filter((e) => e.impact === 'HIGH');
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    let violatingCount = 0;
    let compliantCount = 0;
    const newsAuditLogs: Array<{ tradeId: string; symbol: string; entryTime: string; eventName: string; isViolating: boolean }> = [];

    closedTrades.forEach((t) => {
      const tradeTime = new Date(t.entryDate).getTime();
      let isViolating = false;
      let eventName = 'None';

      highImpactNews.forEach((news) => {
        const newsTime = new Date(`${news.date}T${news.time}:00Z`).getTime();
        const diffMins = Math.abs(tradeTime - newsTime) / (1000 * 60);
        if (diffMins <= windowMins) {
          isViolating = true;
          eventName = news.event;
        }
      });

      if (isViolating) violatingCount++;
      else compliantCount++;

      newsAuditLogs.push({
        tradeId: t.id,
        symbol: t.symbol,
        entryTime: t.entryDate,
        eventName,
        isViolating,
      });
    });

    return {
      restrictedWindowMinutes: windowMins,
      violatingTradesCount: violatingCount,
      compliantTradesCount: compliantCount,
      newsAuditLogs,
    };
  }

  /**
   * Inactivity Monitor (30 consecutive calendar days)
   */
  static calculateInactivity(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    maxDaysAllowed: number;
    daysInactive: number;
    lastTradeDate: string | null;
    status: 'SAFE' | 'WARNING' | 'BREACHED';
  } {
    const maxDays = account.inactivityMaxDays || 30;
    const sorted = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    if (sorted.length === 0) {
      const createdTime = new Date(account.createdAt || Date.now()).getTime();
      const now = Date.now();
      const days = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
      return {
        maxDaysAllowed: maxDays,
        daysInactive: days,
        lastTradeDate: null,
        status: days >= maxDays ? 'BREACHED' : days >= 25 ? 'WARNING' : 'SAFE',
      };
    }

    const lastDateIso = sorted[0].entryDate || sorted[0].exitDate || account.createdAt;
    const lastTime = new Date(lastDateIso).getTime();
    const daysInactive = Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24));

    const status: 'SAFE' | 'WARNING' | 'BREACHED' =
      daysInactive >= maxDays ? 'BREACHED' : daysInactive >= 25 ? 'WARNING' : 'SAFE';

    return {
      maxDaysAllowed: maxDays,
      daysInactive,
      lastTradeDate: lastDateIso,
      status,
    };
  }

  /**
   * Payout & Reward Split Calculator
   */
  static calculatePayoutEligibility(
    account: PropFirmAccount
  ): {
    eligibleProfit: number;
    rewardSplitPercent: number;
    traderShare: number;
    firmShare: number;
    minRequestAmount: number;
    rewardBufferPercent: number;
    rewardBufferAmount: number;
    rewardBufferMet: boolean;
    isEligibleForRequest: boolean;
    statusText: string;
  } {
    const netProfit = roundMoney(Math.max(0, account.currentBalance - account.startingBalance), 2);
    const splitPercent = account.rewardSplitPercent || 80;
    const minRequest = account.minRewardRequest || 100;

    const rewardBufferPercent = account.rewardBufferPercent || 0;
    const rewardBufferAmount = roundMoney(account.startingBalance * (rewardBufferPercent / 100), 2);
    const rewardBufferMet = rewardBufferPercent === 0 || netProfit >= rewardBufferAmount;

    const traderShare = roundMoney(netProfit * (splitPercent / 100), 2);
    const firmShare = roundMoney(netProfit * ((100 - splitPercent) / 100), 2);

    const isEligible = netProfit >= minRequest && rewardBufferMet && account.status !== 'BREACHED';

    let statusText = 'Eligible to submit reward request';
    if (account.status === 'BREACHED') statusText = 'Account is breached. Payouts locked.';
    else if (!rewardBufferMet) statusText = `Must reach +3% reward buffer ($${rewardBufferAmount.toLocaleString()}) before payout claim.`;
    else if (netProfit < minRequest) statusText = `Minimum reward request is $${minRequest}.`;

    return {
      eligibleProfit: netProfit,
      rewardSplitPercent: splitPercent,
      traderShare,
      firmShare,
      minRequestAmount: minRequest,
      rewardBufferPercent,
      rewardBufferAmount,
      rewardBufferMet,
      isEligibleForRequest: isEligible,
      statusText,
    };
  }

  /**
   * Evaluate Full Account State & Auto-Compute Risk State
   */
  static evaluateAccount(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    riskState: PropFirmRiskState;
    statusMessage: string;
    actionableAdvice: string;
    evaluatedRules: PropFirmRule[];
    newViolations: PropFirmViolation[];
  } {
    const ddResult = this.calculateMaxDrawdown(account, trades);
    const dailyResult = this.calculateDailyDrawdown(account, trades);
    const targetResult = this.calculateProfitTarget(account);
    const daysResult = this.calculateTradingDays(account, trades);
    const consistencyResult = this.calculateConsistency(account, trades);
    const durationResult = this.calculateTradeDurations(account, trades);
    const inactivityResult = this.calculateInactivity(account, trades);

    let riskState: PropFirmRiskState = 'SAFE';
    let statusMessage = 'Account comfortably within all risk parameters';
    let actionableAdvice = 'Disciplined execution. Continue adhering to risk management plan.';
    const newViolations: PropFirmViolation[] = [];

    // Evaluate Max Drawdown
    if (ddResult.isBreached) {
      riskState = 'BREACHED';
      statusMessage = `Maximum Drawdown Breached: Account equity ($${account.currentBalance.toLocaleString()}) dropped below allowed threshold ($${ddResult.drawdownThreshold.toLocaleString()})`;
      actionableAdvice = 'Trading halted. Maximum account loss limit exceeded.';
      newViolations.push({
        id: `viol-maxdd-${Date.now()}`,
        accountId: account.id,
        ruleId: 'rule-max-dd',
        ruleName: 'Maximum Overall Drawdown',
        ruleType: 'MAX_DRAWDOWN',
        timestamp: new Date().toISOString(),
        actualValue: `$${ddResult.currentDrawdown.toFixed(2)}`,
        allowedValue: `$${(account.rules.find((r) => r.type === 'MAX_DRAWDOWN')?.threshold || 10000).toFixed(2)}`,
        severity: 'BREACH',
        explanation: 'Account equity dropped below maximum allowable drawdown limit.',
        status: 'ACTIVE',
      });
    } else if (dailyResult.isBreached) {
      riskState = 'BREACHED';
      statusMessage = `Daily Loss Limit Breached: Today's loss of $${dailyResult.todayLoss.toFixed(2)} exceeds daily limit ($${dailyResult.dailyLimit.toFixed(2)})`;
      actionableAdvice = 'Daily circuit breaker triggered. Cease trading for the remainder of the session.';
      newViolations.push({
        id: `viol-daily-${Date.now()}`,
        accountId: account.id,
        ruleId: 'rule-daily-dd',
        ruleName: 'Daily Loss Limit',
        ruleType: 'DAILY_DRAWDOWN',
        timestamp: new Date().toISOString(),
        actualValue: `$${dailyResult.todayLoss.toFixed(2)}`,
        allowedValue: `$${dailyResult.dailyLimit.toFixed(2)}`,
        severity: 'BREACH',
        explanation: 'Current session loss exceeded the configured daily max loss threshold.',
        status: 'ACTIVE',
      });
    } else if (inactivityResult.status === 'BREACHED') {
      riskState = 'BREACHED';
      statusMessage = `Inactivity Breach: No trade executed for ${inactivityResult.daysInactive} consecutive days (Max allowed: 30 days)`;
      actionableAdvice = 'Account marked breached due to consecutive 30-day inactivity rule.';
    } else if (ddResult.bufferRemaining <= 300 || dailyResult.remainingDailyBuffer <= 100) {
      riskState = 'CRITICAL';
      statusMessage = `Critical Risk: Only $${Math.min(ddResult.bufferRemaining, dailyResult.remainingDailyBuffer).toFixed(2)} buffer remaining before rule breach!`;
      actionableAdvice = 'Severely reduce position size or halt active trading until the next session.';
    } else if (ddResult.bufferPercent < 35 || dailyResult.remainingDailyBufferPercent < 35) {
      riskState = 'WARNING';
      statusMessage = `Warning: Approaching risk limits. $${dailyResult.remainingDailyBuffer.toFixed(2)} daily buffer remaining.`;
      actionableAdvice = 'Risk warning triggered. Consider scaling down lots or tightening trade filters.';
    } else if (!consistencyResult.isCompliant) {
      riskState = 'WARNING';
      statusMessage = `Consistency Warning: Single day profit represents ${consistencyResult.consistencyPercent}% of total profit (Max: ${consistencyResult.allowedPercent}%)`;
      actionableAdvice = `Execute additional profit days (+$${consistencyResult.additionalProfitNeeded.toFixed(2)} needed) to satisfy consistency.`;
    } else if (targetResult.isPassed && daysResult.isSatisfied) {
      statusMessage = `Target Achieved & Requirements Met: Phase complete with +$${targetResult.currentProfit.toLocaleString()} profit across ${daysResult.daysCompleted} trading days!`;
      actionableAdvice = 'Ready for evaluation review or profit payout claim.';
    }

    const evaluatedRules = account.rules.map((rule) => {
      const updatedRule: PropFirmRule = { ...rule };
      switch (rule.type) {
        case 'DAILY_DRAWDOWN':
          updatedRule.currentValue = dailyResult.todayLoss;
          updatedRule.status = dailyResult.isBreached
            ? 'BREACHED'
            : dailyResult.remainingDailyBufferPercent < 30
            ? 'CRITICAL'
            : dailyResult.remainingDailyBufferPercent < 60
            ? 'WARNING'
            : 'SAFE';
          updatedRule.details = `Loss: $${dailyResult.todayLoss.toFixed(2)} / $${dailyResult.dailyLimit.toFixed(2)} ($${dailyResult.remainingDailyBuffer.toFixed(2)} buffer)`;
          break;

        case 'MAX_DRAWDOWN':
          updatedRule.currentValue = ddResult.currentDrawdown;
          updatedRule.status = ddResult.isBreached
            ? 'BREACHED'
            : ddResult.bufferPercent < 25
            ? 'CRITICAL'
            : ddResult.bufferPercent < 50
            ? 'WARNING'
            : 'SAFE';
          updatedRule.details = `Drawdown: $${ddResult.currentDrawdown.toFixed(2)} / $${rule.threshold.toFixed(2)} ($${ddResult.bufferRemaining.toFixed(2)} buffer)`;
          break;

        case 'PROFIT_TARGET':
          updatedRule.currentValue = targetResult.currentProfit;
          updatedRule.status = targetResult.isPassed ? 'COMPLETED' : 'INCOMPLETE';
          updatedRule.details = `$${targetResult.currentProfit.toFixed(2)} / $${targetResult.target.toFixed(2)} (${targetResult.progressPercent.toFixed(1)}%)`;
          break;

        case 'MIN_TRADING_DAYS':
          updatedRule.currentValue = daysResult.daysCompleted;
          updatedRule.status = daysResult.isSatisfied ? 'COMPLETED' : 'INCOMPLETE';
          updatedRule.details = `${daysResult.daysCompleted} / ${daysResult.minDaysRequired} days (${daysResult.daysRemaining} remaining)`;
          break;

        case 'QUALIFYING_DAY':
          updatedRule.currentValue = daysResult.qualifyingDaysCompleted;
          updatedRule.status = daysResult.qualifyingDaysCompleted >= (account.minTradingDays || 3) ? 'COMPLETED' : 'INCOMPLETE';
          updatedRule.details = `${daysResult.qualifyingDaysCompleted} qualifying days (+$${daysResult.qualifyingDayThresholdDollar} threshold)`;
          break;

        case 'CONSISTENCY':
          updatedRule.currentValue = consistencyResult.consistencyPercent;
          updatedRule.status = consistencyResult.isCompliant ? 'SAFE' : 'WARNING';
          updatedRule.details = `Best Day: ${consistencyResult.consistencyPercent}% (Max allowed: ${consistencyResult.allowedPercent}%)`;
          break;

        case 'MIN_TRADE_DURATION':
          updatedRule.currentValue = durationResult.minRequiredSec;
          updatedRule.status = durationResult.durationBreachesCount > 0 ? 'WARNING' : 'SAFE';
          updatedRule.details = `${durationResult.durationBreachesCount} duration breaches (< ${durationResult.minRequiredSec}s)`;
          break;

        default:
          updatedRule.status = 'SAFE';
          break;
      }
      return updatedRule;
    });

    return {
      riskState,
      statusMessage,
      actionableAdvice,
      evaluatedRules,
      newViolations,
    };
  }

  /**
   * Pre-Trade Risk & Rule Compliance Check
   */
  static validatePreTrade(
    account: PropFirmAccount,
    trades: Trade[],
    proposedTrade: {
      symbol: string;
      direction: 'BUY' | 'SELL';
      quantity: number;
      stopLossPoints?: number;
      estimatedRiskDollar?: number;
    }
  ): PreTradeValidationResult {
    const checks: PreTradeValidationCheck[] = [];
    let isBlocked = false;
    let hasWarning = false;

    const dailyResult = this.calculateDailyDrawdown(account, trades);
    const ddResult = this.calculateMaxDrawdown(account, trades);
    const symbolExposure = this.calculateSymbolRiskExposure(account, trades);
    const maxPosRule = account.rules.find((r) => r.type === 'MAX_POSITION_SIZE' && r.enabled);

    // 1. Check account breach status
    if (account.riskState === 'BREACHED' || dailyResult.isBreached || ddResult.isBreached) {
      checks.push({
        ruleName: 'Account Breach Guard',
        status: 'FAIL',
        message: 'Account is in BREACHED state. New trade submissions are prohibited.',
      });
      isBlocked = true;
    } else {
      checks.push({
        ruleName: 'Account Status',
        status: 'PASS',
        message: 'Account is in good standing.',
      });
    }

    // 2. Position size check
    if (maxPosRule) {
      if (proposedTrade.quantity > maxPosRule.threshold) {
        checks.push({
          ruleName: 'Max Position Size',
          status: 'FAIL',
          message: `Proposed size (${proposedTrade.quantity}) exceeds allowed limit of ${maxPosRule.threshold} ${maxPosRule.unit.toLowerCase()}.`,
          metric: `${proposedTrade.quantity} / ${maxPosRule.threshold}`,
        });
        isBlocked = true;
      } else {
        checks.push({
          ruleName: 'Max Position Size',
          status: 'PASS',
          message: `Size within limit (${proposedTrade.quantity} of ${maxPosRule.threshold} allowed).`,
        });
      }
    }

    // 3. Daily loss buffer check
    const estRisk = proposedTrade.estimatedRiskDollar || 250;
    if (estRisk > dailyResult.remainingDailyBuffer) {
      checks.push({
        ruleName: 'Daily Loss Buffer Check',
        status: 'FAIL',
        message: `Estimated trade risk ($${estRisk.toFixed(2)}) exceeds remaining daily buffer ($${dailyResult.remainingDailyBuffer.toFixed(2)}).`,
        metric: `Risk $${estRisk.toFixed(2)} vs Buffer $${dailyResult.remainingDailyBuffer.toFixed(2)}`,
      });
      isBlocked = true;
    } else if (estRisk > dailyResult.remainingDailyBuffer * 0.7) {
      checks.push({
        ruleName: 'Daily Loss Buffer Check',
        status: 'WARN',
        message: `Trade risk ($${estRisk.toFixed(2)}) consumes over 70% of remaining daily buffer ($${dailyResult.remainingDailyBuffer.toFixed(2)}).`,
        metric: `Buffer remaining: $${(dailyResult.remainingDailyBuffer - estRisk).toFixed(2)}`,
      });
      hasWarning = true;
    } else {
      checks.push({
        ruleName: 'Daily Loss Buffer Check',
        status: 'PASS',
        message: `Sufficient daily buffer ($${dailyResult.remainingDailyBuffer.toFixed(2)} remaining).`,
      });
    }

    // 4. Symbol Risk Exposure Check
    const existingSym = symbolExposure.find((s) => s.symbol === proposedTrade.symbol);
    const maxAllowedSymRisk = roundMoney(account.startingBalance * ((account.maxRiskPerSymbolPercent || 2) / 100), 2);
    const totalSymRiskAfterTrade = (existingSym?.potentialRiskDollar || 0) + estRisk;

    if (totalSymRiskAfterTrade > maxAllowedSymRisk) {
      checks.push({
        ruleName: 'Max Risk Per Symbol',
        status: 'FAIL',
        message: `Combined risk on ${proposedTrade.symbol} ($${totalSymRiskAfterTrade.toFixed(2)}) exceeds max allowed symbol limit ($${maxAllowedSymRisk.toFixed(2)}).`,
        metric: `Symbol Exposure: $${totalSymRiskAfterTrade.toFixed(2)} / $${maxAllowedSymRisk.toFixed(2)}`,
      });
      isBlocked = true;
    } else {
      checks.push({
        ruleName: 'Max Risk Per Symbol',
        status: 'PASS',
        message: `Symbol risk on ${proposedTrade.symbol} compliant ($${totalSymRiskAfterTrade.toFixed(2)} / $${maxAllowedSymRisk.toFixed(2)} allowed).`,
      });
    }

    const status: 'APPROVED' | 'WARNING' | 'BLOCKED' = isBlocked
      ? 'BLOCKED'
      : hasWarning
      ? 'WARNING'
      : 'APPROVED';

    const summary = isBlocked
      ? 'Trade violates configured prop firm risk constraints.'
      : hasWarning
      ? 'Trade allowed with cautionary risk alerts.'
      : 'Trade fully compliant with all prop firm rules.';

    return {
      status,
      summary,
      checks,
    };
  }
}
