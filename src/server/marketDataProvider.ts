import { resolveSymbolMapping } from '../services/symbolMapping';
import { resolveTimeframe } from '../services/timeframeMapping';
import { OHLCVData, HistoricalCandlesRequest, HistoricalCandlesResponse } from '../types/ohlcv';

// In-Memory Server Cache to respect Twelve Data & provider rate limits
interface CacheEntry {
  timestamp: number;
  data: OHLCVData[];
  provider: string;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL for active pairs

function getCacheKey(params: HistoricalCandlesRequest): string {
  return `${params.symbol.toUpperCase()}:${params.timeframe}:${params.startDate || ''}:${params.endDate || ''}:${params.limit || 350}`;
}

/**
 * Server-side Market Data Provider Adapter
 * Keeps all API keys, secrets, and provider integrations secure on the server.
 */
export async function fetchServerHistoricalCandles(
  params: HistoricalCandlesRequest
): Promise<HistoricalCandlesResponse> {
  const { symbol = 'XAUUSD', timeframe = '15m', limit = 350, startDate, endDate } = params;

  // 1. Check in-memory cache first to avoid Twelve Data rate limits
  const cacheKey = getCacheKey(params);
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
    return {
      success: true,
      symbol,
      timeframe,
      provider: `${cached.provider} (cached)`,
      data: cached.data,
      count: cached.data.length,
    };
  }

  const symbolMap = resolveSymbolMapping(symbol);
  const tfDef = resolveTimeframe(timeframe);

  const providerPreference = (process.env.MARKET_DATA_PROVIDER || 'auto').toLowerCase();
  const apiKey =
    process.env.TWELVE_DATA_API_KEY ||
    process.env.MARKET_DATA_API_KEY ||
    process.env.VITE_TWELVE_DATA_API_KEY ||
    process.env.FINNHUB_API_KEY ||
    process.env.POLYGON_API_KEY ||
    '';

  // 2. Twelve Data Integration (Primary configured historical data API)
  if (
    (providerPreference === 'twelvedata' || apiKey || providerPreference === 'auto') &&
    symbolMap.twelveDataSymbol
  ) {
    try {
      const tdSymbol = encodeURIComponent(symbolMap.twelveDataSymbol);
      const tdInterval = tfDef.twelveDataInterval || '15min';
      let url = `https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${tdInterval}&outputsize=${Math.min(
        5000,
        Math.max(50, limit)
      )}`;

      if (apiKey) {
        url += `&apikey=${apiKey}`;
      }
      if (startDate) {
        url += `&start_date=${startDate}`;
      }
      if (endDate) {
        url += `&end_date=${endDate}`;
      }

      const res = await fetch(url, {
        headers: { 'User-Agent': 'BacktestingReplayTerminal/1.0' },
      });

      if (res.ok) {
        const json = (await res.json()) as any;
        if (json && Array.isArray(json.values) && json.values.length > 0) {
          const rawCandles: OHLCVData[] = json.values.map((v: any) => ({
            time: Math.floor(new Date(v.datetime).getTime() / 1000),
            open: parseFloat(v.open),
            high: parseFloat(v.high),
            low: parseFloat(v.low),
            close: parseFloat(v.close),
            volume: parseFloat(v.volume || '0'),
          }));

          const validated = validateAndNormalizeCandles(rawCandles);
          if (validated.length > 0) {
            memoryCache.set(cacheKey, {
              timestamp: Date.now(),
              data: validated,
              provider: 'twelvedata',
            });

            return {
              success: true,
              symbol,
              timeframe,
              provider: 'twelvedata',
              data: validated,
              count: validated.length,
            };
          }
        } else if (json && json.status === 'error') {
          console.warn('[MarketData TwelveData] Response Notice:', json.message || json.code);
        }
      }
    } catch (err: any) {
      console.warn('[MarketData API] Twelve Data request failed:', err?.message || err);
    }
  }

  // 3. Finnhub Integration
  if (providerPreference === 'finnhub' && apiKey && symbolMap.finnhubSymbol) {
    try {
      const toTime = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor(Date.now() / 1000);
      const fromTime = startDate
        ? Math.floor(new Date(startDate).getTime() / 1000)
        : toTime - limit * tfDef.seconds;

      const url = `https://finnhub.io/api/v1/forex/candle?symbol=${symbolMap.finnhubSymbol}&resolution=${tfDef.finnhubResolution}&from=${fromTime}&to=${toTime}&token=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json && json.s === 'ok' && Array.isArray(json.t) && json.t.length > 0) {
          const rawCandles: OHLCVData[] = json.t.map((t: number, i: number) => ({
            time: t,
            open: json.o[i],
            high: json.h[i],
            low: json.l[i],
            close: json.c[i],
            volume: json.v ? json.v[i] : 0,
          }));

          const validated = validateAndNormalizeCandles(rawCandles);
          if (validated.length > 0) {
            memoryCache.set(cacheKey, {
              timestamp: Date.now(),
              data: validated,
              provider: 'finnhub',
            });

            return {
              success: true,
              symbol,
              timeframe,
              provider: 'finnhub',
              data: validated,
              count: validated.length,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[MarketData API] Finnhub request failed:', err?.message || err);
    }
  }

  // 4. Physical LBMA Spot Gold (1:1 Paxos Gold Bullion) & Live Market Feed
  // Fallback for gold and major assets when third party API quota is exceeded
  const binanceSymbol = symbolMap.binanceSymbol || (symbol === 'XAUUSD' ? 'PAXGUSDT' : null);
  if (binanceSymbol) {
    try {
      const bInterval = tfDef.binanceInterval || '15m';
      let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${bInterval}&limit=${limit}`;

      if (startDate) {
        const startTimeMs = new Date(startDate).getTime();
        if (!isNaN(startTimeMs)) {
          url += `&startTime=${startTimeMs}`;
        }
      }
      if (endDate) {
        const endTimeMs = new Date(endDate).getTime();
        if (!isNaN(endTimeMs)) {
          url += `&endTime=${endTimeMs}`;
        }
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'BacktestingTerminal/1.0' } });
      if (res.ok) {
        const klines = (await res.json()) as any[];
        if (Array.isArray(klines) && klines.length > 0) {
          const rawCandles: OHLCVData[] = klines.map(k => ({
            time: Math.floor(Number(k[0]) / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));

          const validated = validateAndNormalizeCandles(rawCandles);
          if (validated.length > 0) {
            memoryCache.set(cacheKey, {
              timestamp: Date.now(),
              data: validated,
              provider: symbol === 'XAUUSD' ? 'spot_gold_lbma' : 'spot_market_feed',
            });

            return {
              success: true,
              symbol,
              timeframe,
              provider: symbol === 'XAUUSD' ? 'spot_gold_lbma' : 'spot_market_feed',
              data: validated,
              count: validated.length,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[MarketData API] Spot market feed fetch failed:', err?.message || err);
    }
  }

  // 5. Stooq / Public FX / Gold Historical Feed
  try {
    const stooqSymbol = symbol === 'XAUUSD' ? 'xauusd' : symbol.toLowerCase();
    const stooqUrl = `https://stooq.com/q/d/l/?s=${stooqSymbol}&i=d`;
    const res = await fetch(stooqUrl);
    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split('\n');
      if (lines.length > 1) {
        const rawCandles: OHLCVData[] = [];
        // Header: Date,Open,High,Low,Close,Volume
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 5) {
            const dateStr = parts[0];
            const d = new Date(dateStr);
            const time = Math.floor(d.getTime() / 1000);
            const open = parseFloat(parts[1]);
            const high = parseFloat(parts[2]);
            const low = parseFloat(parts[3]);
            const close = parseFloat(parts[4]);
            const volume = parts[5] ? parseFloat(parts[5]) : 0;
            if (!isNaN(time) && !isNaN(open) && !isNaN(close)) {
              rawCandles.push({ time, open, high, low, close, volume });
            }
          }
        }
        const validated = validateAndNormalizeCandles(rawCandles);
        if (validated.length > 0) {
          const sliced = validated.slice(-limit);
          memoryCache.set(cacheKey, {
            timestamp: Date.now(),
            data: sliced,
            provider: 'stooq_market_data',
          });

          return {
            success: true,
            symbol,
            timeframe,
            provider: 'stooq_market_data',
            data: sliced,
            count: sliced.length,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn('[MarketData API] Stooq fallback failed:', err?.message || err);
  }

  return {
    success: false,
    symbol,
    timeframe,
    provider: 'none',
    data: [],
    count: 0,
    error: `Unable to fetch historical market data for ${symbol} on timeframe ${timeframe}. Please check network connection or verify Twelve Data API configuration.`,
  };
}

/**
 * Validates, repairs, deduplicates, and chronologically sorts candle lists.
 */
export function validateAndNormalizeCandles(candles: OHLCVData[]): OHLCVData[] {
  if (!candles || !Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  const validMap = new Map<number, OHLCVData>();

  for (const c of candles) {
    if (!c || typeof c !== 'object') continue;

    const time = Math.floor(Number(c.time));
    const open = Number(c.open);
    const high = Number(c.high);
    const low = Number(c.low);
    const close = Number(c.close);
    const volume = isNaN(Number(c.volume)) ? 0 : Number(c.volume);

    // Reject non-numeric, zero, negative, or invalid timestamps
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

    // Ensure structural OHLC sanity (high is max, low is min)
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
