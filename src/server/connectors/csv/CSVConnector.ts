import { BaseConnector } from '../BaseConnector.ts';
import {
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
} from '../types.ts';

export class CSVConnector extends BaseConnector {
  readonly name = 'CSV File Import';
  readonly platform: PlatformType = 'CSV';

  async testConnection(credentials: ConnectorCredentials): Promise<TestResult> {
    const csvContent = credentials.csvContent || '';
    const startTime = Date.now();

    if (!csvContent || typeof csvContent !== 'string' || csvContent.trim().length === 0) {
      return {
        success: false,
        errorMessage: 'CSV data or file content is required.',
        latencyMs: Date.now() - startTime,
      };
    }

    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return {
        success: false,
        errorMessage: 'CSV must contain at least a header row and one trade row.',
        latencyMs: Date.now() - startTime,
      };
    }

    const broker = credentials.broker || 'CSV Imported Account';
    const accountInfo: AccountInfo = {
      accountId: `csv_${Date.now()}`,
      accountNumber: credentials.accountNumber || `CSV-${Date.now().toString().slice(-4)}`,
      broker,
      platform: 'CSV',
      currency: credentials.currency || 'USD',
      balance: 100000,
      equity: 100000,
      margin: 0,
      freeMargin: 100000,
      leverage: 100,
      name: `${broker} (CSV Import)`,
      type: 'LIVE',
      isReadOnly: true,
      serverTime: new Date().toISOString(),
      pingMs: 0,
    };

    return {
      success: true,
      accountInfo,
      latencyMs: Date.now() - startTime,
      supportedFeatures: ['CSV_PARSING', 'MT4_MT5_FORMAT', 'CTRADER_CSV', 'TRADINGVIEW_EXPORT'],
    };
  }

  async connect(credentials: ConnectorCredentials): Promise<ConnectionResult> {
    const test = await this.testConnection(credentials);
    return {
      connected: test.success,
      accountInfo: test.accountInfo,
      errorMessage: test.errorMessage,
      connectionId: `conn_csv_${Date.now()}`,
    };
  }

  async getAccountInfo(credentials: ConnectorCredentials): Promise<AccountInfo> {
    const test = await this.testConnection(credentials);
    if (!test.success || !test.accountInfo) {
      throw new Error(test.errorMessage || 'Failed to parse CSV account info');
    }
    return test.accountInfo;
  }

  async getOpenPositions(): Promise<Position[]> {
    return [];
  }

  async getPendingOrders(): Promise<Order[]> {
    return [];
  }

  async getDeals(): Promise<Deal[]> {
    return [];
  }

  async getTradeHistory(credentials: ConnectorCredentials, options?: SyncOptions): Promise<NormalizedTrade[]> {
    const csvContent = credentials.csvContent || '';
    if (!csvContent) return [];

    return this.parseCSVTrades(csvContent, credentials.accountNumber || 'CSV_ACC', credentials.broker || 'CSV Broker');
  }

  public parseCSVTrades(csvContent: string, accountNumber: string, broker: string): NormalizedTrade[] {
    const lines = csvContent.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const trades: NormalizedTrade[] = [];

    // Helper to find column index by potential names
    const findCol = (candidates: string[]) => {
      return header.findIndex(h => candidates.some(c => h.includes(c)));
    };

    const symbolIdx = findCol(['symbol', 'instrument', 'item', 'pair', 'ticker']);
    const dirIdx = findCol(['direction', 'type', 'action', 'side', 'dir']);
    const openTimeIdx = findCol(['open time', 'entry date', 'entry time', 'opentime', 'entry', 'time']);
    const closeTimeIdx = findCol(['close time', 'exit date', 'exit time', 'closetime', 'exit']);
    const openPriceIdx = findCol(['open price', 'entry price', 'open', 'price', 'entry']);
    const closePriceIdx = findCol(['close price', 'exit price', 'close', 'exit']);
    const slIdx = findCol(['s/l', 'sl', 'stop loss', 'stoploss']);
    const tpIdx = findCol(['t/p', 'tp', 'take profit', 'takeprofit']);
    const volIdx = findCol(['volume', 'lots', 'size', 'quantity', 'qty', 'amount']);
    const pnlIdx = findCol(['profit', 'pnl', 'net profit', 'net pnl', 'gross profit']);
    const commIdx = findCol(['commission', 'comm', 'fee', 'fees']);
    const swapIdx = findCol(['swap', 'rollover', 'financing']);
    const ticketIdx = findCol(['ticket', 'order', 'deal', 'id', 'trade id', 'position id']);

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/['"]/g, ''));
      if (row.length < 3) continue;

      const symbol = (symbolIdx >= 0 && row[symbolIdx]) ? row[symbolIdx].toUpperCase() : 'EURUSD';
      const rawDir = (dirIdx >= 0 && row[dirIdx]) ? row[dirIdx].toUpperCase() : 'BUY';
      const direction: 'BUY' | 'SELL' = rawDir.includes('SELL') || rawDir.includes('SHORT') ? 'SELL' : 'BUY';

      const entryPrice = parseFloat((openPriceIdx >= 0 && row[openPriceIdx]) || '0') || 1.0;
      const exitPrice = parseFloat((closePriceIdx >= 0 && row[closePriceIdx]) || '0') || entryPrice;
      const stopLoss = (slIdx >= 0 && row[slIdx]) ? parseFloat(row[slIdx]) || undefined : undefined;
      const takeProfit = (tpIdx >= 0 && row[tpIdx]) ? parseFloat(row[tpIdx]) || undefined : undefined;
      const quantity = parseFloat((volIdx >= 0 && row[volIdx]) || '1.0') || 1.0;
      const grossPnl = parseFloat((pnlIdx >= 0 && row[pnlIdx]) || '0') || 0;
      const commission = parseFloat((commIdx >= 0 && row[commIdx]) || '0') || 0;
      const swap = parseFloat((swapIdx >= 0 && row[swapIdx]) || '0') || 0;
      const netPnl = grossPnl + commission + swap;

      let entryDate = (openTimeIdx >= 0 && row[openTimeIdx]) || new Date(Date.now() - 86400000 * (lines.length - i)).toISOString();
      let exitDate = (closeTimeIdx >= 0 && row[closeTimeIdx]) || new Date(new Date(entryDate).getTime() + 7200000).toISOString();

      try {
        entryDate = new Date(entryDate).toISOString();
      } catch {
        entryDate = new Date().toISOString();
      }
      try {
        exitDate = new Date(exitDate).toISOString();
      } catch {
        exitDate = new Date().toISOString();
      }

      const ticket = (ticketIdx >= 0 && row[ticketIdx]) ? row[ticketIdx] : `csv_${i}`;
      const market = this.detectMarket(symbol);
      const session = this.detectSession(entryDate);
      const rMultiple = this.calculateRMultiple(direction, entryPrice, exitPrice, stopLoss);

      trades.push({
        externalTradeId: `CSV_${accountNumber}_${ticket}`,
        platform: 'CSV',
        broker,
        symbol,
        market,
        direction,
        status: 'CLOSED',
        entryDate,
        exitDate,
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        quantity,
        grossPnl,
        netPnl,
        commission,
        swap,
        fees: 0,
        rMultiple,
        roiPercent: 0,
        session,
        setupType: 'CSV Import',
        orderId: String(ticket),
        positionId: String(ticket),
        notes: `Imported via CSV (${ticket})`,
      });
    }

    return trades;
  }
}
