import {
  BrokerConnector,
  PlatformType,
  ConnectorCredentials,
  AccountInfo,
  Position,
  Order,
  Deal,
  NormalizedTrade,
  TestResult,
  ConnectionResult,
  SyncOptions,
  SyncResult,
} from './types.ts';

export abstract class BaseConnector implements BrokerConnector {
  abstract readonly name: string;
  abstract readonly platform: PlatformType;

  abstract testConnection(credentials: ConnectorCredentials): Promise<TestResult>;
  abstract connect(credentials: ConnectorCredentials): Promise<ConnectionResult>;
  abstract getAccountInfo(credentials: ConnectorCredentials): Promise<AccountInfo>;
  abstract getOpenPositions(credentials: ConnectorCredentials): Promise<Position[]>;
  abstract getPendingOrders(credentials: ConnectorCredentials): Promise<Order[]>;
  abstract getTradeHistory(credentials: ConnectorCredentials, options?: SyncOptions): Promise<NormalizedTrade[]>;
  abstract getDeals(credentials: ConnectorCredentials, from?: Date, to?: Date): Promise<Deal[]>;

  async sync(credentials: ConnectorCredentials, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      const accountInfo = await this.getAccountInfo(credentials);
      const trades = await this.getTradeHistory(credentials, options);
      const openPositions = options?.includeOpenPositions ? await this.getOpenPositions(credentials) : [];

      return {
        success: true,
        accountInfo,
        trades,
        openPositions,
        newTradesCount: trades.length,
        updatedTradesCount: 0,
        lastSyncTimestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        trades: [],
        newTradesCount: 0,
        updatedTradesCount: 0,
        lastSyncTimestamp: new Date().toISOString(),
        errorMessage: error?.message || 'Synchronization failed',
        durationMs: Date.now() - startTime,
      };
    }
  }

  async disconnect(): Promise<void> {
    // Default implementation can be overridden if persistent sockets/handles are maintained
    return Promise.resolve();
  }

  /**
   * Helper to categorize symbols into asset classes
   */
  protected detectMarket(symbol: string): 'Forex' | 'Futures' | 'Crypto' | 'Stocks' | 'Indices' | 'Commodities' {
    const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Crypto
    if (
      clean.includes('BTC') ||
      clean.includes('ETH') ||
      clean.includes('SOL') ||
      clean.includes('XRP') ||
      clean.endsWith('USDT')
    ) {
      return 'Crypto';
    }

    // Indices & Futures
    if (
      clean.includes('NQ') ||
      clean.includes('ES') ||
      clean.includes('YM') ||
      clean.includes('RTY') ||
      clean.includes('US30') ||
      clean.includes('US500') ||
      clean.includes('NAS100') ||
      clean.includes('GER40') ||
      clean.includes('DAX') ||
      clean.includes('SPX') ||
      clean.includes('FTSE') ||
      clean.includes('UK100')
    ) {
      return 'Indices';
    }

    // Commodities
    if (
      clean.includes('XAU') ||
      clean.includes('GOLD') ||
      clean.includes('XAG') ||
      clean.includes('SILVER') ||
      clean.includes('USOIL') ||
      clean.includes('UKOIL') ||
      clean.includes('WTI') ||
      clean.includes('BRENT') ||
      clean.includes('CL') ||
      clean.includes('GC')
    ) {
      return 'Commodities';
    }

    // Forex majors and crosses
    const forexCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'SGD', 'HKD', 'SEK', 'NOK', 'ZAR', 'MXN', 'TRY', 'CNH'];
    let matchCount = 0;
    for (const cur of forexCurrencies) {
      if (clean.includes(cur)) matchCount++;
    }
    if (matchCount >= 2 || (clean.length === 6 && forexCurrencies.some(c => clean.startsWith(c)))) {
      return 'Forex';
    }

    // Default to Stocks if not matching above
    return 'Stocks';
  }

  /**
   * Helper to calculate trading session from entry timestamp (UTC hour)
   */
  protected detectSession(isoDate: string): 'London' | 'New York' | 'Asian' | 'Pre-Market' | 'After-Hours' | 'Overlap' {
    try {
      const date = new Date(isoDate);
      const hour = date.getUTCHours();

      // Asian: 00:00 - 07:00 UTC
      if (hour >= 0 && hour < 7) return 'Asian';
      // London: 07:00 - 12:00 UTC
      if (hour >= 7 && hour < 12) return 'London';
      // Overlap (London + NY open): 12:00 - 16:00 UTC
      if (hour >= 12 && hour < 16) return 'Overlap';
      // New York: 16:00 - 21:00 UTC
      if (hour >= 16 && hour < 21) return 'New York';
      // After-Hours / Pre-Market
      return 'After-Hours';
    } catch {
      return 'New York';
    }
  }

  /**
   * Helper to calculate R-Multiple from entry, exit, and stop-loss
   */
  protected calculateRMultiple(
    direction: 'BUY' | 'SELL',
    entryPrice: number,
    exitPrice?: number,
    stopLoss?: number
  ): number {
    if (!exitPrice || !stopLoss) return 0;

    const initialRisk = direction === 'BUY' ? entryPrice - stopLoss : stopLoss - entryPrice;
    if (initialRisk <= 0) return 0;

    const realizedGain = direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
    const r = realizedGain / initialRisk;
    return parseFloat(r.toFixed(2));
  }
}
