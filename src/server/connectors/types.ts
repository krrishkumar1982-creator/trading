import { Trade, ConnectionPlatform } from '../../types/index.ts';

export type PlatformType = ConnectionPlatform;

export interface MT5Credentials {
  accountNumber: string;
  server: string;
  password?: string; // read-only/investor password preferred
  investorPassword?: string;
  nickname?: string;
  broker?: string;
}

export interface CTraderCredentials {
  accountId: string;
  accessToken?: string;
  token?: string;
  environment?: 'live' | 'demo';
  broker?: string;
}

export interface DXtradeCredentials {
  username: string;
  password?: string;
  serverUrl?: string;
  domain?: string;
  accountNumber?: string;
  broker?: string;
}

export interface MatchTraderCredentials {
  login: string;
  password?: string;
  server?: string;
  broker?: string;
}

export interface BrokerApiCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  endpointUrl?: string;
  provider?: string;
  broker?: string;
}

export type ConnectorCredentials = {
  accountNumber?: string;
  accountId?: string;
  username?: string;
  login?: string;
  csvContent?: string;
  currency?: string;
  broker?: string;
  server?: string;
  password?: string;
  investorPassword?: string;
  apiKey?: string;
  apiSecret?: string;
  token?: string;
  accessToken?: string;
  serverUrl?: string;
  endpointUrl?: string;
  provider?: string;
  environment?: 'live' | 'demo';
  nickname?: string;
  [key: string]: any;
};

export interface AccountInfo {
  accountId: string;
  accountNumber: string;
  broker: string;
  server?: string;
  platform: PlatformType;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel?: number;
  leverage: number;
  name?: string;
  type: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  isReadOnly: boolean;
  serverTime?: string;
  pingMs?: number;
}

export interface Position {
  id: string; // Ticket
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  unrealizedPnl: number;
  openTime: string;
  comment?: string;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  timeSetup: string;
  status: 'PENDING' | 'CANCELLED' | 'FILLED';
}

export interface Deal {
  id: string; // Deal ticket
  orderId?: string; // Order ticket
  positionId?: string; // Position ticket
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryType: 'IN' | 'OUT' | 'INOUT';
  volume: number;
  price: number;
  time: string;
  commission: number;
  swap: number;
  profit: number;
  comment?: string;
}

export interface NormalizedTrade {
  externalTradeId: string;
  platform: PlatformType;
  broker: string;
  symbol: string;
  market: 'Forex' | 'Futures' | 'Crypto' | 'Stocks' | 'Indices' | 'Commodities';
  direction: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED';
  entryDate: string; // ISO string
  exitDate?: string; // ISO string
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number; // Volume / Lots / Contracts
  grossPnl: number;
  netPnl: number;
  commission: number;
  swap: number;
  fees: number;
  rMultiple: number;
  roiPercent: number;
  session: 'London' | 'New York' | 'Asian' | 'Pre-Market' | 'After-Hours' | 'Overlap';
  setupType: string;
  orderId?: string;
  positionId?: string;
  notes?: string;
  rawPayload?: any;
}

export interface TestResult {
  success: boolean;
  accountInfo?: AccountInfo;
  errorMessage?: string;
  message?: string;
  latencyMs?: number;
  pingMs?: number;
  supportedFeatures?: string[];
  diagnostics?: Record<string, any>;
  details?: Record<string, any>;
}

export interface ConnectionResult {
  connected: boolean;
  accountInfo?: AccountInfo;
  errorMessage?: string;
  connectionId?: string;
}

export interface SyncOptions {
  from?: Date;
  to?: Date;
  incremental?: boolean;
  lastSyncAt?: string;
  limit?: number;
  includeOpenPositions?: boolean;
}

export interface SyncResult {
  success: boolean;
  accountInfo?: AccountInfo;
  trades: NormalizedTrade[];
  openPositions?: Position[];
  newTradesCount: number;
  updatedTradesCount: number;
  lastSyncTimestamp: string;
  errorMessage?: string;
  durationMs: number;
}

export interface BrokerConnector {
  readonly name: string;
  readonly displayName?: string;
  readonly platform: PlatformType;

  /**
   * Tests the connection without establishing a persistent session.
   * Validates account credentials, server availability, read-only permissions, and latency.
   */
  testConnection(credentials: ConnectorCredentials): Promise<TestResult>;

  /**
   * Connects and verifies active session with the broker terminal or API.
   */
  connect(credentials: ConnectorCredentials): Promise<ConnectionResult>;

  /**
   * Retrieves live account metrics (balance, equity, margin, leverage).
   */
  getAccountInfo(credentials: ConnectorCredentials): Promise<AccountInfo>;

  /**
   * Retrieves currently open market positions.
   */
  getOpenPositions(credentials: ConnectorCredentials): Promise<Position[]>;

  /**
   * Retrieves pending limit/stop orders.
   */
  getPendingOrders(credentials: ConnectorCredentials): Promise<Order[]>;

  /**
   * Retrieves historical closed orders/deals normalized into TradeForge format.
   */
  getTradeHistory(credentials: ConnectorCredentials, options?: SyncOptions): Promise<NormalizedTrade[]>;

  /**
   * Retrieves raw deals/fills.
   */
  getDeals(credentials: ConnectorCredentials, from?: Date, to?: Date): Promise<Deal[]>;

  /**
   * High-level sync method performing incremental retrieval and data normalization.
   */
  sync(credentials: ConnectorCredentials, options?: SyncOptions): Promise<SyncResult>;

  /**
   * Gracefully disconnects or clears active terminal worker handles.
   */
  disconnect(): Promise<void>;
}
