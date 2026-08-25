export type MarketCategory = 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES';

export type TimeframeId = '1m' | '2m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '1D' | '1W' | 'CUSTOM';

export type ChartType =
  | 'CANDLESTICK'
  | 'BAR'
  | 'LINE'
  | 'AREA'
  | 'HEIKIN_ASHI'
  | 'RENKO'
  | 'RANGE'
  | 'LINE_BREAK'
  | 'POINT_FIGURE';

export type ChartLayoutType = 'SINGLE' | 'TWO_HORIZONTAL' | 'TWO_VERTICAL' | 'FOUR_GRID';

export interface InstrumentConfig {
  symbol: string;
  name: string;
  category: MarketCategory;
  decimals: number;
  pipSize: number;
  contractMultiplier: number;
  defaultPrice: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  spreadPips: number;
  description: string;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  isFavorite?: boolean;
}

export interface ReplayCandle {
  time: number; // Unix timestamp in seconds
  timeString: string; // ISO / formatted display string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderDirection = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type PendingOrderStatus = 'PENDING' | 'TRIGGERED' | 'CANCELLED';

export interface ReplayPosition {
  id: string;
  symbol: string;
  direction: OrderDirection;
  orderType: OrderType;
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  units: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: number;
  openTimeString: string;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  rMultiple?: number;
  marginUsed: number;
  commission?: number;
  spreadCost?: number;
  slippageCost?: number;
  strategySetup?: string;
  marketCondition?: string;
  sessionTag?: string;
  tags?: string[];
  notesBefore?: string;
  trailingStopPips?: number;
  trailingPeakPrice?: number;
}

export interface PendingOrder {
  id: string;
  symbol: string;
  direction: OrderDirection;
  orderType: 'LIMIT' | 'STOP';
  targetPrice: number;
  currentPrice: number;
  lotSize: number;
  units: number;
  stopLoss?: number;
  takeProfit?: number;
  placedTime: number;
  placedTimeString: string;
  status: PendingOrderStatus;
  marginRequired: number;
  commission?: number;
  spreadCost?: number;
  slippageCost?: number;
  strategySetup?: string;
  marketCondition?: string;
  sessionTag?: string;
  tags?: string[];
  notesBefore?: string;
}

export type IntrabarAmbiguityRule = 'CONSERVATIVE' | 'OPTIMISTIC' | 'OHLC_PATH' | 'RANDOM';

export interface BacktestSessionSettings {
  startingBalance: number;
  currency: 'USD' | 'EUR' | 'GBP';
  leverage: number;
  riskPercent: number;
  defaultLotSize: number;
  spreadPips: number;
  commissionPerLot: number;
  slippagePips: number;
  intrabarAmbiguityRule: IntrabarAmbiguityRule;
  tradingSession: 'ALL' | 'LONDON' | 'NEW_YORK' | 'ASIAN' | 'SYDNEY';
  timezone: string;
}

export interface ReplayTrade {
  id: string;
  symbol: string;
  direction: OrderDirection;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  lotSize: number;
  units: number;
  openTime: number;
  closeTime: number;
  openTimeString: string;
  closeTimeString: string;
  grossPnl?: number;
  commission?: number;
  spreadCost?: number;
  slippageCost?: number;
  realizedPnl: number; // Net PnL after all costs
  pnlPercent: number;
  rMultiple: number;
  exitReason: 'TP' | 'SL' | 'MANUAL' | 'PARTIAL' | 'TRAILING_STOP';
  durationMinutes: number;
  durationCandles: number;
  strategySetup?: string;
  marketCondition?: string;
  sessionTag?: string;
  tags?: string[];
  mistakeTag?: string;
  disciplineRating?: number; // 1-5
  notesBefore?: string;
  notesDuring?: string;
  notesAfter?: string;
  lessonsLearned?: string;
  imageAttachment?: string;
  ambiguityResolvedBy?: IntrabarAmbiguityRule;
  ambiguityResolutionUsed?: IntrabarAmbiguityRule;
}

export interface DemoAccount {
  startingBalance: number;
  balance: number;
  equity: number;
  currency: 'USD' | 'EUR' | 'GBP';
  leverage: number;
  usedMargin: number;
  freeMargin: number;
  marginLevel: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  peakEquity: number;
  totalCommissionPaid?: number;
  totalSpreadPaid?: number;
  totalSlippagePaid?: number;
}

export type DrawingToolType =
  | 'CURSOR'
  | 'CROSSHAIR'
  | 'PAN'
  // Lines
  | 'TREND_LINE'
  | 'HORIZONTAL_LINE'
  | 'HORIZONTAL_RAY'
  | 'VERTICAL_LINE'
  | 'EXTENDED_LINE'
  | 'ARROW'
  // Channels
  | 'PARALLEL_CHANNEL'
  | 'REGRESSION_CHANNEL'
  | 'PITCHFORK'
  // Fibonacci
  | 'FIB_RETRACEMENT'
  | 'FIB_EXTENSION'
  | 'FIB_PROJECTION'
  | 'FIB_TIME_ZONES'
  // Shapes
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'TRIANGLE'
  | 'BRUSH'
  | 'PATH'
  // Annotations
  | 'TEXT'
  | 'NOTE'
  | 'PRICE_LABEL'
  | 'CALLOUT'
  // Measurement
  | 'LONG_POSITION'
  | 'SHORT_POSITION'
  | 'PRICE_RANGE'
  | 'DATE_RANGE'
  | 'DATE_PRICE_RANGE';

export interface DrawingPoint {
  time: number; // candle time in seconds
  price: number; // price level
}

export interface ChartDrawing {
  id: string;
  type: DrawingToolType;
  points: DrawingPoint[];
  color: string;
  fillColor?: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  text?: string;
  locked?: boolean;
  visible?: boolean;
  // Specialized parameters
  riskAmount?: number;
  targetPrice?: number;
  stopPrice?: number;
  entryPrice?: number;
  lotSize?: number;
}

export interface IndicatorVisibility {
  sma20: boolean;
  sma50: boolean;
  sma200: boolean;
  ema20: boolean;
  bollinger: boolean;
  rsi: boolean;
  macd: boolean;
  volume: boolean;
}

export type IndicatorCategory = 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME';

export interface IndicatorConfig {
  id: string;
  type: string;
  name: string;
  category: IndicatorCategory;
  pane: 'MAIN' | 'LOWER_1' | 'LOWER_2' | 'LOWER_3';
  visible: boolean;
  params: Record<string, number | string | boolean>;
  styles: {
    color: string;
    secondaryColor?: string;
    lineWidth: number;
    fillColor?: string;
    upperColor?: string;
    lowerColor?: string;
  };
}

export interface ChartAlert {
  id: string;
  symbol: string;
  condition: 'CROSS_ABOVE' | 'CROSS_BELOW' | 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_MOVE';
  targetPrice: number;
  currentPrice: number;
  message: string;
  createdAt: number;
  createdAtString: string;
  triggered: boolean;
  triggeredAt?: number;
  triggeredAtString?: string;
  triggeredPrice?: number;
  soundEnabled: boolean;
}

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  chartType: ChartType;
  indicators: IndicatorConfig[];
  colorTheme?: string;
}

export interface SavedBacktestSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  symbol: string;
  timeframe: TimeframeId;
  chartType: ChartType;
  startDate: string;
  startIndex: number;
  currentIndex: number;
  account: DemoAccount;
  settings?: BacktestSessionSettings;
  positions: ReplayPosition[];
  pendingOrders?: PendingOrder[];
  trades: ReplayTrade[];
  drawings: ChartDrawing[];
  indicators: IndicatorConfig[];
  alerts?: ChartAlert[];
  notes?: string;
}

export interface SessionMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  avgR: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdownDollar: number;
  maxDrawdownPercent: number;
  longestWinStreak: number;
  longestLossStreak: number;
  avgDurationMinutes: number;
  expectancy: number;
}

export interface ChartSettingsConfig {
  bullishColor: string;
  bearishColor: string;
  wickColor: string;
  lineColor: string;
  areaTopColor: string;
  areaBottomColor: string;
  gridLinesColor: string;
  showGridLines: boolean;
  showWatermark: boolean;
  showVolume: boolean;
  priceScaleMode: 'NORMAL' | 'LOGARITHMIC' | 'PERCENTAGE';
  showCountdownToBarClose: boolean;
}

export interface SyncSettings {
  syncCrosshair: boolean;
  syncTimeframe: boolean;
  syncSymbol: boolean;
  syncDrawings: boolean;
}
