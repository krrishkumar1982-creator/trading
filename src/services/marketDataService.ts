import {
  OHLCVData,
  HistoricalCandlesRequest,
  HistoricalCandlesResponse,
  MarketSymbolInfo,
} from '../types/ohlcv';
import { resolveSymbolMapping, SYMBOL_PROVIDER_MAP } from './symbolMapping';
import { resolveTimeframe } from './timeframeMapping';

/**
 * Validates, repairs, deduplicates, and chronologically sorts candle lists.
 * Enforces structural integrity: high >= max(open, close) and low <= min(open, close).
 */
export function validateAndNormalizeCandles(candles: any[]): OHLCVData[] {
  if (!candles || !Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const validMap = new Map<number, OHLCVData>();

  for (const c of candles) {
    if (!c || typeof c !== 'object') continue;

    // Handle possible timestamp formats (seconds, milliseconds, ISO date strings)
    let time = 0;
    if (typeof c.time === 'number') {
      time = c.time > 1e11 ? Math.floor(c.time / 1000) : Math.floor(c.time);
    } else if (typeof c.t === 'number') {
      time = c.t > 1e11 ? Math.floor(c.t / 1000) : Math.floor(c.t);
    } else if (c.datetime || c.date) {
      const parsed = new Date(c.datetime || c.date).getTime();
      if (!isNaN(parsed)) time = Math.floor(parsed / 1000);
    }

    const open = Number(c.open ?? c.o);
    const high = Number(c.high ?? c.h);
    const low = Number(c.low ?? c.l);
    const close = Number(c.close ?? c.c);
    const volume = isNaN(Number(c.volume ?? c.v)) ? 0 : Number(c.volume ?? c.v);

    // Reject invalid numeric values or negative/zero prices
    if (
      isNaN(time) ||
      time <= 0 ||
      isNaN(open) ||
      open <= 0 ||
      isNaN(high) ||
      high <= 0 ||
      isNaN(low) ||
      low <= 0 ||
      isNaN(close) ||
      close <= 0
    ) {
      continue;
    }

    // Ensure mathematical high/low envelope sanity
    const normalizedHigh = Math.max(high, open, close);
    const normalizedLow = Math.min(low, open, close);

    validMap.set(time, {
      time,
      open,
      high: normalizedHigh,
      low: normalizedLow,
      close,
      volume: Math.max(0, volume),
    });
  }

  // Strictly sort chronologically ascending
  return Array.from(validMap.values()).sort((a, b) => a.time - b.time);
}

/**
 * Market Data Service
 * Client interface for requesting real historical OHLCV data.
 * Does not fall back to fake random candles.
 */
export class MarketDataService {
  /**
   * Fetches real historical market data from backend proxy `/api/market-data/candles`.
   */
  public async getHistoricalCandles(params: HistoricalCandlesRequest): Promise<OHLCVData[]> {
    const { symbol = 'XAUUSD', timeframe = '15m', limit = 350, startDate, endDate } = params;

    const query = new URLSearchParams();
    query.set('symbol', symbol);
    query.set('timeframe', timeframe);
    query.set('limit', String(limit));
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);

    try {
      const res = await fetch(`/api/market-data/candles?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        let errMessage = `HTTP error ${res.status}: Failed to fetch historical data`;
        try {
          const errJson = await res.json();
          if (errJson?.error) errMessage = errJson.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const response: HistoricalCandlesResponse = await res.json();

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.error || `No market data returned for ${symbol} on ${timeframe}.`);
      }

      const normalized = this.validateCandles(response.data);
      if (normalized.length === 0) {
        throw new Error(`Market data provider returned 0 valid candles for ${symbol}.`);
      }

      return normalized;
    } catch (err: any) {
      console.error(`[MarketDataService] Request failed for ${symbol} (${timeframe}):`, err);

      // Direct client fallback to Spot Gold feed if server proxy is unavailable
      if (typeof window !== 'undefined') {
        const directData = await this.fetchDirectSpotFeed(params);
        if (directData && directData.length > 0) {
          return directData;
        }
      }

      throw err;
    }
  }

  /**
   * Direct fallback to public spot feed in case the backend proxy is blocked by browser security
   */
  private async fetchDirectSpotFeed(params: HistoricalCandlesRequest): Promise<OHLCVData[] | null> {
    const { symbol = 'XAUUSD', timeframe = '15m', limit = 350, startDate } = params;
    const symbolMap = resolveSymbolMapping(symbol);
    const tfDef = resolveTimeframe(timeframe);
    const binanceSymbol = symbolMap.binanceSymbol || (symbol === 'XAUUSD' ? 'PAXGUSDT' : null);

    if (!binanceSymbol) return null;

    try {
      let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${tfDef.binanceInterval}&limit=${limit}`;
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        if (!isNaN(startMs)) url += `&startTime=${startMs}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const klines = await res.json();
        if (Array.isArray(klines)) {
          const raw = klines.map((k: any) => ({
            time: Math.floor(Number(k[0]) / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
          return this.validateCandles(raw);
        }
      }
    } catch (_) {}
    return null;
  }

  /**
   * Normalizes candle data from any raw source.
   */
  public normalizeCandles(candles: any[]): OHLCVData[] {
    return validateAndNormalizeCandles(candles);
  }

  /**
   * Validates and verifies structural integrity of candles.
   */
  public validateCandles(candles: OHLCVData[]): OHLCVData[] {
    return validateAndNormalizeCandles(candles);
  }

  /**
   * Retrieves instrument metadata.
   */
  public getSymbolInfo(symbol: string): MarketSymbolInfo {
    const map = resolveSymbolMapping(symbol);
    return {
      symbol: map.symbol,
      name: map.name,
      category: map.category,
      decimals: map.decimals,
      pipSize: map.pipSize,
      defaultPrice: map.symbol === 'XAUUSD' ? 2385.5 : 100.0,
    };
  }
}

export const marketDataService = new MarketDataService();
export const chartDataService = marketDataService;
export default marketDataService;
