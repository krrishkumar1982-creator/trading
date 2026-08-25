import { Trade } from '../../types';
import { getMetricById, MetricDefinition } from './metricsCatalog';

export type TimeGrouping = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type DimensionGrouping =
  | 'DAY_OF_WEEK'
  | 'MONTH_OF_YEAR'
  | 'TRADE_TIME'
  | 'TRADE_DURATION'
  | 'RISK_VOLUMES'
  | 'SYMBOLS'
  | 'PLAYBOOKS'
  | 'TAGS'
  | 'OPTIONS_DTE'
  | 'WINS_VS_LOSSES';

export interface DataPoint {
  dateKey: string;
  label: string;
  timestamp: number;
  [metricId: string]: any;
}

export interface MetricSeriesResult {
  metric: MetricDefinition;
  values: number[];
  formattedValues: string[];
}

export interface ChartCalculationResult {
  labels: string[];
  points: DataPoint[];
  series: MetricSeriesResult[];
}

export interface DimensionBucket {
  key: string;
  label: string;
  order: number;
}

export function getDefaultBucketsForDimension(dimension: DimensionGrouping): DimensionBucket[] {
  if (dimension === 'DAY_OF_WEEK') {
    return [
      { key: 'Mon', label: 'Monday', order: 1 },
      { key: 'Tue', label: 'Tuesday', order: 2 },
      { key: 'Wed', label: 'Wednesday', order: 3 },
      { key: 'Thu', label: 'Thursday', order: 4 },
      { key: 'Fri', label: 'Friday', order: 5 },
      { key: 'Sat', label: 'Saturday', order: 6 },
      { key: 'Sun', label: 'Sunday', order: 7 },
    ];
  }

  if (dimension === 'MONTH_OF_YEAR') {
    return [
      { key: 'Jan', label: 'Jan', order: 1 },
      { key: 'Feb', label: 'Feb', order: 2 },
      { key: 'Mar', label: 'Mar', order: 3 },
      { key: 'Apr', label: 'Apr', order: 4 },
      { key: 'May', label: 'May', order: 5 },
      { key: 'Jun', label: 'Jun', order: 6 },
      { key: 'Jul', label: 'Jul', order: 7 },
      { key: 'Aug', label: 'Aug', order: 8 },
      { key: 'Sep', label: 'Sep', order: 9 },
      { key: 'Oct', label: 'Oct', order: 10 },
      { key: 'Nov', label: 'Nov', order: 11 },
      { key: 'Dec', label: 'Dec', order: 12 },
    ];
  }

  if (dimension === 'TRADE_TIME') {
    return [
      { key: '00:00–03:59', label: '00:00–03:59', order: 1 },
      { key: '04:00–07:59', label: '04:00–07:59', order: 2 },
      { key: '08:00–11:59', label: '08:00–11:59', order: 3 },
      { key: '12:00–15:59', label: '12:00–15:59', order: 4 },
      { key: '16:00–19:59', label: '16:00–19:59', order: 5 },
      { key: '20:00–23:59', label: '20:00–23:59', order: 6 },
    ];
  }

  if (dimension === 'TRADE_DURATION') {
    return [
      { key: '< 1m', label: '< 1 min', order: 1 },
      { key: '1–5m', label: '1–5 mins', order: 2 },
      { key: '5–15m', label: '5–15 mins', order: 3 },
      { key: '15–30m', label: '15–30 mins', order: 4 },
      { key: '30–60m', label: '30–60 mins', order: 5 },
      { key: '1–2h', label: '1–2 hours', order: 6 },
      { key: '2–4h', label: '2–4 hours', order: 7 },
      { key: '4h+', label: '4+ hours', order: 8 },
    ];
  }

  if (dimension === 'RISK_VOLUMES') {
    return [
      { key: '1 Contract', label: '1 Contract', order: 1 },
      { key: '2–4 Contracts', label: '2–4 Contracts', order: 2 },
      { key: '5–9 Contracts', label: '5–9 Contracts', order: 3 },
      { key: '10+ Contracts', label: '10+ Contracts', order: 4 },
    ];
  }

  if (dimension === 'WINS_VS_LOSSES') {
    return [
      { key: 'Wins', label: 'Winning Trades', order: 1 },
      { key: 'Losses', label: 'Losing Trades', order: 2 },
      { key: 'Breakeven', label: 'Breakeven Trades', order: 3 },
    ];
  }

  return [];
}

export function getTradeDimensionKey(trade: Trade, dimension: DimensionGrouping): string {
  const d = new Date(trade.entryDate || Date.now());

  if (dimension === 'DAY_OF_WEEK') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayIdx = isNaN(d.getDay()) ? 1 : d.getDay();
    return days[dayIdx];
  }

  if (dimension === 'MONTH_OF_YEAR') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = isNaN(d.getMonth()) ? 0 : d.getMonth();
    return months[mIdx];
  }

  if (dimension === 'TRADE_TIME') {
    const hrs = isNaN(d.getHours()) ? 9 : d.getHours();
    if (hrs < 4) return '00:00–03:59';
    if (hrs < 8) return '04:00–07:59';
    if (hrs < 12) return '08:00–11:59';
    if (hrs < 16) return '12:00–15:59';
    if (hrs < 20) return '16:00–19:59';
    return '20:00–23:59';
  }

  if (dimension === 'TRADE_DURATION') {
    let dur = trade.durationMinutes;
    if (dur === undefined || dur === null) {
      if (trade.entryDate && trade.exitDate) {
        dur = Math.max(0, Math.round((new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / 60000));
      } else {
        dur = 15;
      }
    }
    if (dur < 1) return '< 1m';
    if (dur <= 5) return '1–5m';
    if (dur <= 15) return '5–15m';
    if (dur <= 30) return '15–30m';
    if (dur <= 60) return '30–60m';
    if (dur <= 120) return '1–2h';
    if (dur <= 240) return '2–4h';
    return '4h+';
  }

  if (dimension === 'RISK_VOLUMES') {
    const qty = trade.quantity || 1;
    if (qty === 1) return '1 Contract';
    if (qty <= 4) return '2–4 Contracts';
    if (qty <= 9) return '5–9 Contracts';
    return '10+ Contracts';
  }

  if (dimension === 'SYMBOLS') {
    return trade.symbol || 'N/A';
  }

  if (dimension === 'PLAYBOOKS') {
    return trade.playbookId || trade.setupType || 'Uncategorized';
  }

  if (dimension === 'TAGS') {
    return (trade.tags && trade.tags.length > 0) ? trade.tags[0] : 'No Tag';
  }

  if (dimension === 'WINS_VS_LOSSES') {
    if (trade.netPnl > 0) return 'Wins';
    if (trade.netPnl < 0) return 'Losses';
    return 'Breakeven';
  }

  return 'All';
}

function getBucketKeyAndLabel(dateStr: string | undefined, grouping: TimeGrouping): { key: string; label: string; timestamp: number } {
  if (!dateStr) {
    const d = new Date(2026, 0, 1);
    return { key: '2026-01-01', label: 'Jan 1, 26', timestamp: d.getTime() };
  }

  const d = new Date(dateStr);
  const time = d.getTime();

  if (isNaN(time)) {
    return { key: 'unknown', label: 'Unknown', timestamp: 0 };
  }

  if (grouping === 'DAY') {
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { key, label, timestamp: new Date(key).getTime() };
  }

  if (grouping === 'WEEK') {
    const temp = new Date(d.valueOf());
    const dayNum = (d.getDay() + 6) % 7;
    temp.setDate(temp.getDate() - dayNum + 3);
    const firstThursday = temp.valueOf();
    temp.setMonth(0, 1);
    if (temp.getDay() !== 4) {
      temp.setMonth(0, 1 + ((4 - temp.getDay() + 7) % 7));
    }
    const weekNum = 1 + Math.round((firstThursday - temp.valueOf()) / 604800000);
    const year = d.getFullYear();
    const key = `${year}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;
    const label = `W${weekNum} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    return { key, label, timestamp: time };
  }

  if (grouping === 'MONTH') {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { key, label, timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
  }

  // YEAR
  const key = `${d.getFullYear()}`;
  const label = `${d.getFullYear()}`;
  return { key, label, timestamp: new Date(d.getFullYear(), 0, 1).getTime() };
}

export function formatMetricValue(val: number, unit: MetricDefinition['unit']): string {
  if (val === undefined || val === null || isNaN(val)) return '0';

  if (unit === 'currency') {
    const isNeg = val < 0;
    const abs = Math.abs(val);
    const formatted = abs >= 1000000
      ? `$${(abs / 1000000).toFixed(2)}M`
      : abs >= 10000
      ? `$${(abs / 1000).toFixed(1)}k`
      : `$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    return isNeg ? `-${formatted}` : formatted;
  }

  if (unit === 'percent') {
    return `${val.toFixed(1)}%`;
  }

  if (unit === 'ratio') {
    return `${val.toFixed(2)}R`;
  }

  if (unit === 'duration') {
    if (val >= 60) {
      const hrs = Math.floor(val / 60);
      const mins = Math.round(val % 60);
      return `${hrs}h ${mins}m`;
    }
    return `${Math.round(val)}m`;
  }

  if (unit === 'days') {
    return `${Math.round(val)}d`;
  }

  return val % 1 === 0 ? val.toString() : val.toFixed(1);
}

export function calculateChartSeries(
  trades: Trade[],
  metricIds: string[],
  grouping: TimeGrouping,
  dimensionGrouping?: DimensionGrouping
): ChartCalculationResult {
  const closedTrades = [...trades]
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  // Handle Dimension Grouping (Days of week, Months of year, Trade Time, Trade Duration, etc.)
  if (dimensionGrouping) {
    const defaultBuckets = getDefaultBucketsForDimension(dimensionGrouping);
    const bucketMap = new Map<string, { key: string; label: string; order: number; trades: Trade[] }>();

    // Pre-populate predefined buckets
    defaultBuckets.forEach(b => {
      bucketMap.set(b.key, { key: b.key, label: b.label, order: b.order, trades: [] });
    });

    // Distribute closed trades into dimension buckets
    closedTrades.forEach(t => {
      const dimKey = getTradeDimensionKey(t, dimensionGrouping);
      if (!bucketMap.has(dimKey)) {
        bucketMap.set(dimKey, { key: dimKey, label: dimKey, order: bucketMap.size + 10, trades: [] });
      }
      bucketMap.get(dimKey)!.trades.push(t);
    });

    const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) => a.order - b.order);

    const points: DataPoint[] = [];
    let runningCumPnl = 0;

    sortedBuckets.forEach(b => {
      const pt: DataPoint = {
        dateKey: b.key,
        label: b.label,
        timestamp: b.order,
      };

      const bTrades = b.trades;
      const bucketPnl = bTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0);
      const wins = bTrades.filter(t => t.netPnl > 0);
      const losses = bTrades.filter(t => t.netPnl < 0);
      const breakevens = bTrades.filter(t => t.netPnl === 0);

      const grossProfit = wins.reduce((acc, t) => acc + t.netPnl, 0);
      const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
      runningCumPnl += bucketPnl;

      metricIds.forEach(mId => {
        let val = 0;

        switch (mId) {
          case 'net_pnl':
          case 'daily_pnl':
            val = bucketPnl;
            break;
          case 'cumulative_pnl':
            val = runningCumPnl;
            break;
          case 'gross_profit':
            val = grossProfit;
            break;
          case 'gross_loss':
            val = grossLoss;
            break;
          case 'avg_win':
            val = wins.length > 0 ? grossProfit / wins.length : 0;
            break;
          case 'avg_loss':
            val = losses.length > 0 ? grossLoss / losses.length : 0;
            break;
          case 'win_rate':
            val = bTrades.length > 0 ? (wins.length / bTrades.length) * 100 : 0;
            break;
          case 'loss_rate':
            val = bTrades.length > 0 ? (losses.length / bTrades.length) * 100 : 0;
            break;
          case 'profit_factor':
            val = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
            break;
          case 'expectancy': {
            const wr = bTrades.length > 0 ? wins.length / bTrades.length : 0;
            const lr = bTrades.length > 0 ? losses.length / bTrades.length : 0;
            const aw = wins.length > 0 ? grossProfit / wins.length : 0;
            const al = losses.length > 0 ? grossLoss / losses.length : 0;
            val = (wr * aw) - (lr * al);
            break;
          }
          case 'avg_net_trade_pnl':
            val = bTrades.length > 0 ? bucketPnl / bTrades.length : 0;
            break;
          case 'r_multiple':
            val = bTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
            break;
          case 'avg_r_multiple': {
            const rSum = bTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
            val = bTrades.length > 0 ? rSum / bTrades.length : 0;
            break;
          }
          case 'total_trades':
            val = bTrades.length;
            break;
          case 'winning_trades':
            val = wins.length;
            break;
          case 'losing_trades':
            val = losses.length;
            break;
          case 'breakeven_trades':
            val = breakevens.length;
            break;
          case 'trading_volume':
          case 'contracts_quantity':
            val = bTrades.reduce((acc, t) => acc + (t.quantity || 1), 0);
            break;
          case 'avg_hold_time_cum':
            val = bTrades.length > 0 ? bTrades.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) / bTrades.length : 0;
            break;
          case 'logged_days_cum':
            val = new Set(bTrades.map(t => t.entryDate?.split('T')[0])).size;
            break;
          case 'largest_win':
            val = wins.length > 0 ? Math.max(...wins.map(t => t.netPnl)) : 0;
            break;
          case 'largest_loss':
            val = losses.length > 0 ? Math.abs(Math.min(...losses.map(t => t.netPnl))) : 0;
            break;
          default:
            val = bucketPnl;
            break;
        }

        pt[mId] = val;
      });

      points.push(pt);
    });

    const series: MetricSeriesResult[] = metricIds.map(mId => {
      const metricDef = getMetricById(mId);
      const values = points.map(p => (typeof p[mId] === 'number' ? p[mId] : 0));
      const formattedValues = values.map(v => formatMetricValue(v, metricDef.unit));

      return {
        metric: metricDef,
        values,
        formattedValues,
      };
    });

    return {
      labels: points.map(p => p.label),
      points,
      series,
    };
  }

  // Chronological Time Grouping (DAY, WEEK, MONTH, YEAR)
  const bucketMap = new Map<string, { key: string; label: string; timestamp: number; trades: Trade[] }>();

  closedTrades.forEach(t => {
    const { key, label, timestamp } = getBucketKeyAndLabel(t.entryDate, grouping);
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { key, label, timestamp, trades: [] });
    }
    bucketMap.get(key)!.trades.push(t);
  });

  const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  // Fallback if no trades exist
  if (sortedBuckets.length === 0) {
    const now = new Date();
    const dummyKey = now.toISOString().split('T')[0];
    const dummyLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    sortedBuckets.push({ key: dummyKey, label: dummyLabel, timestamp: now.getTime(), trades: [] });
  }

  // Pre-calculate running cumulative states for metrics that need full history
  let cumulativePnlRunning = 0;
  let cumulativePeak = 0;
  let cumulativeMaxDd = 0;
  const activeDaysSet = new Set<string>();
  let totalHoldMinutesRunning = 0;
  let totalTradesCountRunning = 0;
  let longestDurationRunning = 0;

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;

  let consecutiveGreenDays = 0;
  let consecutiveRedDays = 0;
  let maxGreenDays = 0;
  let maxRedDays = 0;

  let runningGreenDaysCount = 0;
  let runningRedDaysCount = 0;

  const points: DataPoint[] = [];

  sortedBuckets.forEach(b => {
    const pt: DataPoint = {
      dateKey: b.key,
      label: b.label,
      timestamp: b.timestamp,
    };

    const bTrades = b.trades;
    const bucketPnl = bTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0);
    const wins = bTrades.filter(t => t.netPnl > 0);
    const losses = bTrades.filter(t => t.netPnl < 0);
    const breakevens = bTrades.filter(t => t.netPnl === 0);

    const grossProfit = wins.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));

    // Update trade streaks
    bTrades.forEach(t => {
      totalTradesCountRunning += 1;
      const hold = t.durationMinutes || 30;
      totalHoldMinutesRunning += hold;
      if (hold > longestDurationRunning) longestDurationRunning = hold;

      if (t.netPnl > 0) {
        currentWinStreak += 1;
        currentLossStreak = 0;
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
      } else if (t.netPnl < 0) {
        currentLossStreak += 1;
        currentWinStreak = 0;
        if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
      }
    });

    // Cumulative PnL update
    cumulativePnlRunning += bucketPnl;
    if (cumulativePnlRunning > cumulativePeak) {
      cumulativePeak = cumulativePnlRunning;
    }
    const currentDd = cumulativePeak - cumulativePnlRunning;
    if (currentDd > cumulativeMaxDd) {
      cumulativeMaxDd = currentDd;
    }

    // Active days
    if (bTrades.length > 0) {
      activeDaysSet.add(b.key);
      if (bucketPnl > 0) {
        runningGreenDaysCount += 1;
        consecutiveGreenDays += 1;
        consecutiveRedDays = 0;
        if (consecutiveGreenDays > maxGreenDays) maxGreenDays = consecutiveGreenDays;
      } else if (bucketPnl < 0) {
        runningRedDaysCount += 1;
        consecutiveRedDays += 1;
        consecutiveGreenDays = 0;
        if (consecutiveRedDays > maxRedDays) maxRedDays = consecutiveRedDays;
      }
    }

    // Calculate each metric value for this point
    metricIds.forEach(mId => {
      let val = 0;

      switch (mId) {
        // --- 1. TIME ANALYSIS ---
        case 'logged_days_cum':
          val = activeDaysSet.size;
          break;
        case 'avg_trading_days_duration_cum':
          val = activeDaysSet.size > 0 ? (totalHoldMinutesRunning / activeDaysSet.size) / 60 : 0;
          break;
        case 'avg_hold_time_cum':
          val = totalTradesCountRunning > 0 ? totalHoldMinutesRunning / totalTradesCountRunning : 0;
          break;
        case 'longest_trade_duration_cum':
          val = longestDurationRunning;
          break;
        case 'max_trading_days_duration_cum':
          val = maxGreenDays;
          break;

        // --- 2. PROFITABILITY ---
        case 'net_pnl':
        case 'daily_pnl':
          val = bucketPnl;
          break;
        case 'gross_profit':
          val = grossProfit;
          break;
        case 'gross_loss':
          val = grossLoss;
          break;
        case 'avg_win':
          val = wins.length > 0 ? grossProfit / wins.length : 0;
          break;
        case 'avg_loss':
          val = losses.length > 0 ? grossLoss / losses.length : 0;
          break;
        case 'win_rate':
          val = bTrades.length > 0 ? (wins.length / bTrades.length) * 100 : 0;
          break;
        case 'loss_rate':
          val = bTrades.length > 0 ? (losses.length / bTrades.length) * 100 : 0;
          break;
        case 'profit_factor':
          val = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
          break;
        case 'expectancy': {
          const wr = bTrades.length > 0 ? wins.length / bTrades.length : 0;
          const lr = bTrades.length > 0 ? losses.length / bTrades.length : 0;
          const aw = wins.length > 0 ? grossProfit / wins.length : 0;
          const al = losses.length > 0 ? grossLoss / losses.length : 0;
          val = (wr * aw) - (lr * al);
          break;
        }
        case 'avg_net_trade_pnl':
          val = bTrades.length > 0 ? bucketPnl / bTrades.length : 0;
          break;
        case 'cumulative_pnl':
          val = cumulativePnlRunning;
          break;
        case 'r_multiple':
          val = bTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
          break;
        case 'avg_r_multiple': {
          const rSum = bTrades.reduce((acc, t) => acc + (t.rMultiple || 0), 0);
          val = bTrades.length > 0 ? rSum / bTrades.length : 0;
          break;
        }

        // --- 3. RISK & DRAWDOWN ---
        case 'max_drawdown':
          val = cumulativeMaxDd;
          break;
        case 'current_drawdown':
          val = currentDd;
          break;
        case 'drawdown_pct':
          val = cumulativePeak > 0 ? (currentDd / cumulativePeak) * 100 : 0;
          break;
        case 'avg_drawdown':
          val = cumulativeMaxDd > 0 ? cumulativeMaxDd * 0.5 : 0;
          break;
        case 'risk_per_trade':
        case 'avg_risk': {
          const riskSum = bTrades.reduce((acc, t) => {
            const risk = (t.entryPrice && t.stopLoss) ? Math.abs(t.entryPrice - t.stopLoss) * (t.quantity || 1) : Math.abs(t.netPnl || 100);
            return acc + risk;
          }, 0);
          val = bTrades.length > 0 ? riskSum / bTrades.length : 100;
          break;
        }
        case 'largest_loss': {
          const minPnl = Math.min(0, ...bTrades.map(t => t.netPnl));
          val = Math.abs(minPnl);
          break;
        }
        case 'largest_win': {
          const maxPnl = Math.max(0, ...bTrades.map(t => t.netPnl));
          val = maxPnl;
          break;
        }

        // --- 4. TRADING ACTIVITY & VOLUME ---
        case 'total_trades':
          val = bTrades.length;
          break;
        case 'trades_per_day':
          val = activeDaysSet.size > 0 ? totalTradesCountRunning / activeDaysSet.size : 0;
          break;
        case 'winning_trades':
          val = wins.length;
          break;
        case 'losing_trades':
          val = losses.length;
          break;
        case 'breakeven_trades':
          val = breakevens.length;
          break;
        case 'trading_volume':
        case 'contracts_quantity':
          val = bTrades.reduce((acc, t) => acc + (t.quantity || 1), 0);
          break;
        case 'avg_daily_volume': {
          const totalVol = bTrades.reduce((acc, t) => acc + (t.quantity || 1), 0);
          val = activeDaysSet.size > 0 ? totalVol / activeDaysSet.size : 0;
          break;
        }
        case 'long_vs_short': {
          const longs = bTrades.filter(t => t.direction === 'BUY').length;
          const shorts = bTrades.filter(t => t.direction === 'SELL').length;
          val = shorts > 0 ? longs / shorts : longs;
          break;
        }

        // --- 5. STREAKS & CONSISTENCY ---
        case 'current_win_streak':
          val = currentWinStreak;
          break;
        case 'current_loss_streak':
          val = currentLossStreak;
          break;
        case 'longest_win_streak':
          val = longestWinStreak;
          break;
        case 'longest_loss_streak':
          val = longestLossStreak;
          break;
        case 'consecutive_winning_days':
          val = maxGreenDays;
          break;
        case 'consecutive_losing_days':
          val = maxRedDays;
          break;
        case 'consistency_score': {
          // Compute standard deviation of bucket returns
          const avgBucket = bucketPnl / (bTrades.length || 1);
          const variance = bTrades.reduce((acc, t) => acc + Math.pow(t.netPnl - avgBucket, 2), 0) / (bTrades.length || 1);
          const stdDev = Math.sqrt(variance);
          const rawScore = 100 - Math.min(60, stdDev / 20);
          val = Math.max(20, Math.min(98, rawScore));
          break;
        }
        case 'green_days':
          val = runningGreenDaysCount;
          break;
        case 'red_days':
          val = runningRedDaysCount;
          break;

        default:
          val = bucketPnl;
          break;
      }

      pt[mId] = val;
    });

    points.push(pt);
  });

  const series: MetricSeriesResult[] = metricIds.map(mId => {
    const metricDef = getMetricById(mId);
    const values = points.map(p => (typeof p[mId] === 'number' ? p[mId] : 0));
    const formattedValues = values.map(v => formatMetricValue(v, metricDef.unit));

    return {
      metric: metricDef,
      values,
      formattedValues,
    };
  });

  return {
    labels: points.map(p => p.label),
    points,
    series,
  };
}
