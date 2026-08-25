/**
 * OHLCV Candle Data Structure
 * Standardized, normalized format for interactive charting and replay backtesting.
 */
export interface OHLCVData {
  time: number; // Unix timestamp in SECONDS (e.g. 1718000000)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalCandlesRequest {
  symbol: string;
  timeframe: string;
  startDate?: string; // ISO date 'YYYY-MM-DD'
  endDate?: string;   // ISO date 'YYYY-MM-DD'
  limit?: number;     // Number of bars, default 350
}

export interface HistoricalCandlesResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  provider: string;
  data: OHLCVData[];
  count: number;
  error?: string;
}

export interface MarketSymbolInfo {
  symbol: string;
  name: string;
  category: 'COMMODITIES' | 'FOREX' | 'CRYPTO' | 'INDICES';
  decimals: number;
  pipSize: number;
  defaultPrice: number;
}
