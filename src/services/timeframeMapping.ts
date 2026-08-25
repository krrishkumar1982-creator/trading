/**
 * Timeframe Mapping & Configuration
 * Centralized translation layer between UI timeframe labels and internal/provider intervals.
 */

export type UITimeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '1D' | '1W';

export interface TimeframeDefinition {
  id: UITimeframe;
  label: string;
  seconds: number;
  minutes: number;
  twelveDataInterval: string;
  finnhubResolution: string;
  polygonMultiplier: number;
  polygonTimespan: 'minute' | 'hour' | 'day' | 'week';
  binanceInterval: string;
}

export const TIMEFRAME_MAP: Record<string, TimeframeDefinition> = {
  '1m': {
    id: '1m',
    label: '1 Minute',
    seconds: 60,
    minutes: 1,
    twelveDataInterval: '1min',
    finnhubResolution: '1',
    polygonMultiplier: 1,
    polygonTimespan: 'minute',
    binanceInterval: '1m',
  },
  '3m': {
    id: '3m',
    label: '3 Minutes',
    seconds: 180,
    minutes: 3,
    twelveDataInterval: '3min',
    finnhubResolution: '3',
    polygonMultiplier: 3,
    polygonTimespan: 'minute',
    binanceInterval: '3m',
  },
  '5m': {
    id: '5m',
    label: '5 Minutes',
    seconds: 300,
    minutes: 5,
    twelveDataInterval: '5min',
    finnhubResolution: '5',
    polygonMultiplier: 5,
    polygonTimespan: 'minute',
    binanceInterval: '5m',
  },
  '15m': {
    id: '15m',
    label: '15 Minutes',
    seconds: 900,
    minutes: 15,
    twelveDataInterval: '15min',
    finnhubResolution: '15',
    polygonMultiplier: 15,
    polygonTimespan: 'minute',
    binanceInterval: '15m',
  },
  '30m': {
    id: '30m',
    label: '30 Minutes',
    seconds: 1800,
    minutes: 30,
    twelveDataInterval: '30min',
    finnhubResolution: '30',
    polygonMultiplier: 30,
    polygonTimespan: 'minute',
    binanceInterval: '30m',
  },
  '1H': {
    id: '1H',
    label: '1 Hour',
    seconds: 3600,
    minutes: 60,
    twelveDataInterval: '1h',
    finnhubResolution: '60',
    polygonMultiplier: 1,
    polygonTimespan: 'hour',
    binanceInterval: '1h',
  },
  '1h': {
    id: '1H',
    label: '1 Hour',
    seconds: 3600,
    minutes: 60,
    twelveDataInterval: '1h',
    finnhubResolution: '60',
    polygonMultiplier: 1,
    polygonTimespan: 'hour',
    binanceInterval: '1h',
  },
  '2H': {
    id: '2H',
    label: '2 Hours',
    seconds: 7200,
    minutes: 120,
    twelveDataInterval: '2h',
    finnhubResolution: '120',
    polygonMultiplier: 2,
    polygonTimespan: 'hour',
    binanceInterval: '2h',
  },
  '2h': {
    id: '2H',
    label: '2 Hours',
    seconds: 7200,
    minutes: 120,
    twelveDataInterval: '2h',
    finnhubResolution: '120',
    polygonMultiplier: 2,
    polygonTimespan: 'hour',
    binanceInterval: '2h',
  },
  '4H': {
    id: '4H',
    label: '4 Hours',
    seconds: 14400,
    minutes: 240,
    twelveDataInterval: '4h',
    finnhubResolution: '240',
    polygonMultiplier: 4,
    polygonTimespan: 'hour',
    binanceInterval: '4h',
  },
  '4h': {
    id: '4H',
    label: '4 Hours',
    seconds: 14400,
    minutes: 240,
    twelveDataInterval: '4h',
    finnhubResolution: '240',
    polygonMultiplier: 4,
    polygonTimespan: 'hour',
    binanceInterval: '4h',
  },
  '1D': {
    id: '1D',
    label: '1 Day',
    seconds: 86400,
    minutes: 1440,
    twelveDataInterval: '1day',
    finnhubResolution: 'D',
    polygonMultiplier: 1,
    polygonTimespan: 'day',
    binanceInterval: '1d',
  },
  '1d': {
    id: '1D',
    label: '1 Day',
    seconds: 86400,
    minutes: 1440,
    twelveDataInterval: '1day',
    finnhubResolution: 'D',
    polygonMultiplier: 1,
    polygonTimespan: 'day',
    binanceInterval: '1d',
  },
  '1W': {
    id: '1W',
    label: '1 Week',
    seconds: 604800,
    minutes: 10080,
    twelveDataInterval: '1week',
    finnhubResolution: 'W',
    polygonMultiplier: 1,
    polygonTimespan: 'week',
    binanceInterval: '1w',
  },
  '1w': {
    id: '1W',
    label: '1 Week',
    seconds: 604800,
    minutes: 10080,
    twelveDataInterval: '1week',
    finnhubResolution: 'W',
    polygonMultiplier: 1,
    polygonTimespan: 'week',
    binanceInterval: '1w',
  },
};

/**
 * Resolves UI timeframe string to normalized TimeframeDefinition.
 */
export function resolveTimeframe(tf: string): TimeframeDefinition {
  return TIMEFRAME_MAP[tf] || TIMEFRAME_MAP['15m'];
}
