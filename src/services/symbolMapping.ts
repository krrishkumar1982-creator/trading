/**
 * Centralized Symbol Mapping
 * Maps UI canonical symbols (e.g. XAUUSD) to provider-specific identifiers.
 */

export interface SymbolProviderMapping {
  symbol: string;
  name: string;
  category: 'COMMODITIES' | 'FOREX' | 'CRYPTO' | 'INDICES';
  decimals: number;
  pipSize: number;
  twelveDataSymbol: string;
  finnhubSymbol: string;
  polygonTicker: string;
  binanceSymbol?: string;
  alphaVantageFrom?: string;
  alphaVantageTo?: string;
}

export const SYMBOL_PROVIDER_MAP: Record<string, SymbolProviderMapping> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar (Spot)',
    category: 'COMMODITIES',
    decimals: 2,
    pipSize: 0.1,
    twelveDataSymbol: 'XAU/USD',
    finnhubSymbol: 'OANDA:XAU_USD',
    polygonTicker: 'C:XAUUSD',
    binanceSymbol: 'PAXGUSDT', // 1:1 Paxos Gold spot bullion physically backed in London LBMA vaults
    alphaVantageFrom: 'XAU',
    alphaVantageTo: 'USD',
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    decimals: 5,
    pipSize: 0.0001,
    twelveDataSymbol: 'EUR/USD',
    finnhubSymbol: 'OANDA:EUR_USD',
    polygonTicker: 'C:EURUSD',
    binanceSymbol: 'EURUSDT',
    alphaVantageFrom: 'EUR',
    alphaVantageTo: 'USD',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'FOREX',
    decimals: 5,
    pipSize: 0.0001,
    twelveDataSymbol: 'GBP/USD',
    finnhubSymbol: 'OANDA:GBP_USD',
    polygonTicker: 'C:GBPUSD',
    binanceSymbol: 'GBPUSDT',
    alphaVantageFrom: 'GBP',
    alphaVantageTo: 'USD',
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX',
    decimals: 3,
    pipSize: 0.01,
    twelveDataSymbol: 'USD/JPY',
    finnhubSymbol: 'OANDA:USD_JPY',
    polygonTicker: 'C:USDJPY',
    binanceSymbol: 'USDJPY',
    alphaVantageFrom: 'USD',
    alphaVantageTo: 'JPY',
  },
  BTCUSD: {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'CRYPTO',
    decimals: 2,
    pipSize: 1.0,
    twelveDataSymbol: 'BTC/USD',
    finnhubSymbol: 'BINANCE:BTCUSDT',
    polygonTicker: 'X:BTCUSD',
    binanceSymbol: 'BTCUSDT',
    alphaVantageFrom: 'BTC',
    alphaVantageTo: 'USD',
  },
  ETHUSD: {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'CRYPTO',
    decimals: 2,
    pipSize: 0.1,
    twelveDataSymbol: 'ETH/USD',
    finnhubSymbol: 'BINANCE:ETHUSDT',
    polygonTicker: 'X:ETHUSD',
    binanceSymbol: 'ETHUSDT',
    alphaVantageFrom: 'ETH',
    alphaVantageTo: 'USD',
  },
  NAS100: {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    category: 'INDICES',
    decimals: 2,
    pipSize: 0.25,
    twelveDataSymbol: 'IXIC',
    finnhubSymbol: 'QQQ',
    polygonTicker: 'I:NDX',
    alphaVantageFrom: 'QQQ',
    alphaVantageTo: 'USD',
  },
  US500: {
    symbol: 'US500',
    name: 'S&P 500 Index',
    category: 'INDICES',
    decimals: 2,
    pipSize: 0.25,
    twelveDataSymbol: 'SPX',
    finnhubSymbol: 'SPY',
    polygonTicker: 'I:SPX',
    alphaVantageFrom: 'SPY',
    alphaVantageTo: 'USD',
  },
  USOIL: {
    symbol: 'USOIL',
    name: 'WTI Crude Oil',
    category: 'COMMODITIES',
    decimals: 2,
    pipSize: 0.01,
    twelveDataSymbol: 'WTI/USD',
    finnhubSymbol: 'OANDA:WTICO_USD',
    polygonTicker: 'C:USOIL',
  },
};

/**
 * Resolves a symbol string to its provider mappings.
 */
export function resolveSymbolMapping(symbol: string): SymbolProviderMapping {
  const normalized = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (
    SYMBOL_PROVIDER_MAP[normalized] ||
    SYMBOL_PROVIDER_MAP[symbol] || {
      symbol,
      name: symbol,
      category: 'FOREX',
      decimals: 5,
      pipSize: 0.0001,
      twelveDataSymbol: symbol,
      finnhubSymbol: symbol,
      polygonTicker: symbol,
    }
  );
}
