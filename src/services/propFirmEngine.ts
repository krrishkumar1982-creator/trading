import {
  PropFirmAccount,
  PropFirmRule,
  PropFirmViolation,
  PropFirmRiskState,
  Trade,
  PreTradeValidationResult,
  PreTradeValidationCheck,
  PropFirmPhase,
} from '../types';
import { roundMoney, safeAdd, safeSub } from '../lib/calcEngine';

/**
 * Prop Firm Rule Templates
 * Starter presets that can be customized, duplicated, or extended by the user.
 */
export const PROP_FIRM_TEMPLATES: {
  id: string;
  name: string;
  firmName: string;
  startingBalance: number;
  phase: PropFirmPhase;
  drawdownModel: 'STATIC' | 'EOD_TRAILING' | 'INTRADAY_HWM_TRAILING';
  dailyDrawdownModel: 'START_OF_DAY_BALANCE' | 'START_OF_DAY_EQUITY' | 'BALANCE_BASED';
  sessionTimezone: string;
  rules: Omit<PropFirmRule, 'currentValue' | 'status'>[];
}[] = [
  {
    id: 'template-ftmo-100k',
    name: 'FTMO Standard $100K Challenge (Phase 1)',
    firmName: 'FTMO',
    startingBalance: 100000,
    phase: 'PHASE_1',
    drawdownModel: 'STATIC',
    dailyDrawdownModel: 'START_OF_DAY_BALANCE',
    sessionTimezone: 'Europe/Prague',
    rules: [
      {
        id: 'rule-ftmo-daily-dd',
        name: 'Maximum Daily Loss',
        type: 'DAILY_DRAWDOWN',
        description: 'Maximum daily loss is 5% of start-of-day balance ($5,000). Resets at 00:00 CE(S)T.',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 5%',
        warningThreshold: 3500,
        criticalThreshold: 4500,
      },
      {
        id: 'rule-ftmo-max-dd',
        name: 'Maximum Overall Loss',
        type: 'MAX_DRAWDOWN',
        description: 'Overall equity/balance must not drop below 10% of initial balance ($90,000).',
        enabled: true,
        threshold: 10000,
        unit: 'USD',
        calculationMethodology: 'Static Initial Balance − $10,000',
        warningThreshold: 7500,
        criticalThreshold: 9200,
      },
      {
        id: 'rule-ftmo-target',
        name: 'Profit Target',
        type: 'PROFIT_TARGET',
        description: 'Reach 10% profit ($10,000) on closed trades to pass Phase 1.',
        enabled: true,
        threshold: 10000,
        unit: 'USD',
        calculationMethodology: 'Initial Balance + $10,000',
      },
      {
        id: 'rule-ftmo-min-days',
        name: 'Minimum Trading Days',
        type: 'MIN_TRADING_DAYS',
        description: 'Must execute at least one trade on 4 distinct trading days.',
        enabled: true,
        threshold: 4,
        unit: 'DAYS',
        calculationMethodology: 'Count of unique trading dates with closed executions',
      },
      {
        id: 'rule-ftmo-news',
        name: 'News Trading Restriction',
        type: 'NEWS_RESTRICTION',
        description: 'No executing trades 2 minutes before to 2 minutes after high impact news (Swing accounts exempt).',
        enabled: true,
        threshold: 2,
        unit: 'MINUTES',
        calculationMethodology: 'Restricted window around Tier-1 economic releases',
      },
    ],
  },
  {
    id: 'template-topstep-50k',
    name: 'Topstep $50K Trading Combine',
    firmName: 'Topstep',
    startingBalance: 50000,
    phase: 'PHASE_1',
    drawdownModel: 'EOD_TRAILING',
    dailyDrawdownModel: 'START_OF_DAY_BALANCE',
    sessionTimezone: 'America/Chicago',
    rules: [
      {
        id: 'rule-ts-daily-loss',
        name: 'Daily Loss Limit',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit of $1,000 (net P&L across current CME session).',
        enabled: true,
        threshold: 1000,
        unit: 'USD',
        calculationMethodology: 'Net P&L during CME session (5PM - 4PM CT)',
        warningThreshold: 700,
        criticalThreshold: 900,
      },
      {
        id: 'rule-ts-max-dd',
        name: 'End-of-Day Trailing Maximum Loss',
        type: 'MAX_DRAWDOWN',
        description: 'Trails highest end-of-day balance by $2,000 until reaching starting balance + $100.',
        enabled: true,
        threshold: 2000,
        unit: 'USD',
        calculationMethodology: 'EOD Peak Balance − $2,000 (locks at $50,100)',
        warningThreshold: 1400,
        criticalThreshold: 1800,
      },
      {
        id: 'rule-ts-target',
        name: 'Profit Target',
        type: 'PROFIT_TARGET',
        description: 'Achieve $3,000 net profit target.',
        enabled: true,
        threshold: 3000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance + $3,000',
      },
      {
        id: 'rule-ts-consistency',
        name: 'Consistency Target',
        type: 'CONSISTENCY',
        description: 'Best single trading day cannot exceed 50% of total profit.',
        enabled: true,
        threshold: 50,
        unit: 'PERCENT',
        calculationMethodology: '(Best Day Profit / Total Realized Profit) × 100',
        warningThreshold: 42,
        criticalThreshold: 49,
      },
      {
        id: 'rule-ts-max-pos',
        name: 'Maximum Contract Size',
        type: 'MAX_POSITION_SIZE',
        description: 'Max 5 standard futures contracts or 50 micros.',
        enabled: true,
        threshold: 5,
        unit: 'CONTRACTS',
        calculationMethodology: 'Aggregate open position lot/contract count',
      },
    ],
  },
  {
    id: 'template-apex-150k',
    name: 'Apex Trader Funding $150K Evaluation',
    firmName: 'Apex Trader Funding',
    startingBalance: 150000,
    phase: 'PHASE_1',
    drawdownModel: 'INTRADAY_HWM_TRAILING',
    dailyDrawdownModel: 'START_OF_DAY_BALANCE',
    sessionTimezone: 'America/Chicago',
    rules: [
      {
        id: 'rule-apex-max-trailing',
        name: 'Intraday Live Trailing Threshold',
        type: 'MAX_DRAWDOWN',
        description: 'Live trailing threshold of $5,000 from intraday high-water mark until locked at $150,100.',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Intraday Peak Balance − $5,000',
        warningThreshold: 3800,
        criticalThreshold: 4600,
      },
      {
        id: 'rule-apex-target',
        name: 'Profit Target',
        type: 'PROFIT_TARGET',
        description: 'Reach $9,000 in net profit.',
        enabled: true,
        threshold: 9000,
        unit: 'USD',
        calculationMethodology: 'Starting Balance + $9,000',
      },
      {
        id: 'rule-apex-min-days',
        name: 'Minimum Trading Days',
        type: 'MIN_TRADING_DAYS',
        description: 'Minimum of 1 trading day required.',
        enabled: true,
        threshold: 1,
        unit: 'DAYS',
        calculationMethodology: 'Unique trade execution dates',
      },
      {
        id: 'rule-apex-consistency',
        name: 'Consistency Rule (Payout Phase)',
        type: 'CONSISTENCY',
        description: 'Single day profits must not exceed 30% of total profit during payout verification.',
        enabled: true,
        threshold: 30,
        unit: 'PERCENT',
        calculationMethodology: '(Highest Single Day PnL / Total Profit) × 100',
      },
      {
        id: 'rule-apex-max-pos',
        name: 'Maximum Contracts',
        type: 'MAX_POSITION_SIZE',
        description: 'Max 17 contracts (ES/NQ) or 170 micros.',
        enabled: true,
        threshold: 17,
        unit: 'CONTRACTS',
        calculationMethodology: 'Max contract scaling',
      },
    ],
  },
  {
    id: 'template-fundednext-100k',
    name: 'FundedNext $100K Stellar 2-Step',
    firmName: 'FundedNext',
    startingBalance: 100000,
    phase: 'PHASE_1',
    drawdownModel: 'STATIC',
    dailyDrawdownModel: 'START_OF_DAY_BALANCE',
    sessionTimezone: 'UTC',
    rules: [
      {
        id: 'rule-fn-daily-loss',
        name: 'Daily Loss Limit (Balance Based)',
        type: 'DAILY_DRAWDOWN',
        description: 'Daily loss limit 5% based on previous day ending balance.',
        enabled: true,
        threshold: 5000,
        unit: 'USD',
        calculationMethodology: 'Start-of-Day Balance × 5%',
        warningThreshold: 3500,
        criticalThreshold: 4600,
      },
      {
        id: 'rule-fn-max-dd',
        name: 'Maximum Overall Drawdown',
        type: 'MAX_DRAWDOWN',
        description: 'Maximum overall loss 10% from initial balance ($10,000).',
        enabled: true,
        threshold: 10000,
        unit: 'USD',
        calculationMethodology: 'Static Initial Balance − $10,000',
        warningThreshold: 7500,
        criticalThreshold: 9200,
      },
      {
        id: 'rule-fn-target',
        name: 'Profit Target (Phase 1)',
        type: 'PROFIT_TARGET',
        description: '8% profit target ($8,000) to advance to Phase 2.',
        enabled: true,
        threshold: 8000,
        unit: 'USD',
        calculationMethodology: 'Initial Balance + $8,000',
      },
      {
        id: 'rule-fn-min-days',
        name: 'Minimum Trading Days',
        type: 'MIN_TRADING_DAYS',
        description: 'Trade a minimum of 5 trading days.',
        enabled: true,
        threshold: 5,
        unit: 'DAYS',
        calculationMethodology: 'Unique active trading days',
      },
    ],
  },
];

/**
 * Prop Firm Rule Engine & Calculations
 */
export class PropFirmEngine {
  /**
   * Calculate daily metrics and session boundaries in designated timezone
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
    const maxLossRule = account.rules.find((r) => r.type === 'MAX_DRAWDOWN' && r.enabled);
    const maxLossThreshold = maxLossRule ? maxLossRule.threshold : initial * 0.1;

    // Chronologically sort closed trades
    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
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
        // Absolute static limit: Starting balance - Max loss
        drawdownThreshold = roundMoney(initial - maxLossThreshold, 2);
        currentDrawdown = Math.max(0, roundMoney(initial - account.currentBalance, 2));
        break;
      }
      case 'EOD_TRAILING': {
        // Trails highest EOD balance by max loss, locking at initial balance + $100
        const lockInLevel = initial + 100;
        const rawThreshold = roundMoney(eodPeak - maxLossThreshold, 2);
        drawdownThreshold = Math.min(rawThreshold, lockInLevel);
        currentDrawdown = Math.max(0, roundMoney(eodPeak - account.currentBalance, 2));
        break;
      }
      case 'INTRADAY_HWM_TRAILING': {
        // Trails highest intraday high-water mark
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
    const dailyRule = account.rules.find((r) => r.type === 'DAILY_DRAWDOWN' && r.enabled);
    const dailyLimit = dailyRule ? dailyRule.threshold : account.startingBalance * 0.05;

    const todayStr = this.getSessionTradingDate(new Date().toISOString(), account.sessionTimezone);
    const dailyGroups = this.groupTradesByTradingDay(trades, account.sessionTimezone);
    const todayGroup = dailyGroups[todayStr] || { trades: [], netPnl: 0 };

    const todayNetPnl = roundMoney(todayGroup.netPnl, 2);
    const todayLoss = todayNetPnl < 0 ? Math.abs(todayNetPnl) : 0;

    // Start-of-day balance is current balance minus today's net P&L
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
    const targetRule = account.rules.find((r) => r.type === 'PROFIT_TARGET' && r.enabled);
    const target = targetRule ? targetRule.threshold : account.startingBalance * 0.1;

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
   * Calculate Unique Trading Days Completed
   */
  static calculateTradingDays(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    minDaysRequired: number;
    daysCompleted: number;
    daysRemaining: number;
    tradingDates: string[];
    isSatisfied: boolean;
  } {
    const daysRule = account.rules.find((r) => r.type === 'MIN_TRADING_DAYS' && r.enabled);
    const minDaysRequired = daysRule ? daysRule.threshold : 4;

    const dailyGroups = this.groupTradesByTradingDay(trades, account.sessionTimezone);
    const tradingDates = Object.keys(dailyGroups).filter((d) => dailyGroups[d].trades.length > 0);
    const daysCompleted = tradingDates.length;
    const daysRemaining = Math.max(0, minDaysRequired - daysCompleted);
    const isSatisfied = daysCompleted >= minDaysRequired;

    return {
      minDaysRequired,
      daysCompleted,
      daysRemaining,
      tradingDates,
      isSatisfied,
    };
  }

  /**
   * Calculate Consistency Metric
   */
  static calculateConsistency(
    account: PropFirmAccount,
    trades: Trade[]
  ): {
    bestDayProfit: number;
    totalProfit: number;
    consistencyPercent: number;
    allowedPercent: number;
    marginRemaining: number;
    isCompliant: boolean;
  } {
    const consistencyRule = account.rules.find((r) => r.type === 'CONSISTENCY' && r.enabled);
    const allowedPercent = consistencyRule ? consistencyRule.threshold : 40;

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

    return {
      bestDayProfit: roundMoney(bestDayProfit, 2),
      totalProfit: roundMoney(totalPositiveProfit, 2),
      consistencyPercent,
      allowedPercent,
      marginRemaining,
      isCompliant,
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
        explanation: "Current session loss exceeded the configured daily max loss threshold.",
        status: 'ACTIVE',
      });
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
      actionableAdvice = 'Trade additional volume over multiple sessions to balance profit distribution.';
    } else if (targetResult.isPassed && daysResult.isSatisfied) {
      statusMessage = `Target Achieved & Requirements Met: Phase complete with +$${targetResult.currentProfit.toLocaleString()} profit across ${daysResult.daysCompleted} trading days!`;
      actionableAdvice = 'Ready for evaluation review or profit payout claim.';
    }

    // Map evaluated rules with their live runtime values & statuses
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

        case 'CONSISTENCY':
          updatedRule.currentValue = consistencyResult.consistencyPercent;
          updatedRule.status = consistencyResult.isCompliant ? 'SAFE' : 'WARNING';
          updatedRule.details = `Best Day: ${consistencyResult.consistencyPercent}% (Max allowed: ${consistencyResult.allowedPercent}%)`;
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
    const maxPosRule = account.rules.find((r) => r.type === 'MAX_POSITION_SIZE' && r.enabled);
    const maxRiskRule = account.rules.find((r) => r.type === 'MAX_OPEN_RISK' && r.enabled);

    // 1. Check if account is already breached
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

    // 2. Check position size against max allowed
    if (maxPosRule) {
      if (proposedTrade.quantity > maxPosRule.threshold) {
        checks.push({
          ruleName: 'Max Position Size',
          status: 'FAIL',
          message: `Proposed size (${proposedTrade.quantity}) exceeds allowed limit of ${maxPosRule.threshold} ${maxPosRule.unit.toLowerCase()}.`,
          metric: `${proposedTrade.quantity} / ${maxPosRule.threshold}`,
        });
        isBlocked = true;
      } else if (proposedTrade.quantity >= maxPosRule.threshold * 0.8) {
        checks.push({
          ruleName: 'Max Position Size',
          status: 'WARN',
          message: `Size (${proposedTrade.quantity}) is near the maximum ceiling (${maxPosRule.threshold}).`,
          metric: `${proposedTrade.quantity} / ${maxPosRule.threshold}`,
        });
        hasWarning = true;
      } else {
        checks.push({
          ruleName: 'Max Position Size',
          status: 'PASS',
          message: `Size within limit (${proposedTrade.quantity} of ${maxPosRule.threshold} allowed).`,
        });
      }
    }

    // 3. Check risk exposure vs daily drawdown buffer
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

    // 4. Max open risk rule check
    if (maxRiskRule && estRisk > maxRiskRule.threshold) {
      checks.push({
        ruleName: 'Max Risk Per Trade',
        status: 'FAIL',
        message: `Risk ($${estRisk.toFixed(2)}) exceeds max allowed per trade ($${maxRiskRule.threshold.toFixed(2)}).`,
      });
      isBlocked = true;
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
