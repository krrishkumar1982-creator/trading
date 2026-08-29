export type MarketType = 'Forex' | 'Futures' | 'Crypto' | 'Stocks' | 'Indices' | 'Commodities';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type SessionType = 'London' | 'New York' | 'Asian' | 'Pre-Market' | 'After-Hours' | 'Overlap';
export type CurrencyDisplayMode = 'USD' | 'PERCENT' | 'R_MULTIPLE' | 'TICKS' | 'PRIVACY';

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  market: MarketType;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: string; // ISO string
  exitDate?: string; // ISO string
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number; // lots, contracts, or shares
  grossPnl: number;
  netPnl: number;
  commission: number;
  swap: number;
  fees: number;
  rMultiple: number; // e.g. +2.4R or -1.0R
  roiPercent: number;
  session: SessionType;
  strategyId?: string;
  playbookId?: string;
  setupType: string;
  rating: number; // 1 to 5 stars
  notes: string;
  tags: string[];
  mistakes: string[];
  rulesFollowed: boolean;
  screenshotUrl?: string;
  afterScreenshotUrl?: string;
  durationMinutes: number;
  emotionalState?: 'Disciplined' | 'Confident' | 'Neutral' | 'FOMO' | 'Revenge' | 'Hesitant' | 'Greedy';
}

export interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  type: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isDefault: boolean;
  lastSync?: string;
  syncStatus: 'HEALTHY' | 'SYNCING' | 'DISCONNECTED' | 'ERROR';
}

export interface PlaybookRule {
  id: string;
  text: string;
  category: 'ENTRY' | 'EXIT' | 'RISK' | 'MARKET';
  required: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string;
  description: string;
  status: 'A_PLUS' | 'STANDARD' | 'EXPERIMENTAL' | 'DEPRECATED';
  rules: PlaybookRule[];
  exampleScreenshots: string[];
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  expectancy: number;
  missedTradesCount: number;
  isPrivate: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  marketType: MarketType;
  winRate: number;
  totalTrades: number;
  netPnl: number;
  profitFactor: number;
  rules: string[];
  isActive: boolean;
}

export interface JournalNote {
  id: string;
  accountId: string;
  date: string;
  title: string;
  folderId: string;
  tags: string[];
  content: string;
  preMarketPlan: {
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    keyLevels: string;
    newsEvents: string;
    maxRiskPerTrade: string;
    checklist: { id: string; text: string; checked: boolean }[];
  };
  postMarketReview: {
    whatWentWell: string;
    whatWentWrong: string;
    lessonsLearned: string;
    disciplineRating: number; // 1 to 5
    emotionalRating: number; // 1 to 5
    executionGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  };
  contractsTraded?: number;
  volume?: number;
  netPnl?: number;
  netRoi?: number;
  screenshots: string[];
  templateUsed?: string;
  isFavorite?: boolean;
}

export interface JournalFolder {
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

export interface RiskGoalSettings {
  dailyProfitTarget?: number;
  weeklyProfitTarget?: number;
  monthlyProfitTarget?: number;
  maxDailyLoss?: number;
  dailyMaxLoss?: number;
  maxWeeklyLoss?: number;
  maxDrawdown?: number;
  maxDrawdownLimit?: number;
  maxRiskPerTradePercent?: number;
  maxTradesPerDay?: number;
  maxConsecutiveLosses?: number;
  maxContractsPerTrade?: number;
  enforceCircuitBreaker?: boolean;
  circuitBreakerTriggered?: boolean;
}

export interface EconomicEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  currency: string;
  event: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast?: string;
  previous?: string;
  isFavorite?: boolean;
  hasReminder?: boolean;
}

export interface BacktestCandle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  quantity: number;
  entryIndex: number;
  exitIndex?: number;
  entryTime: string;
  exitTime?: string;
  pnl: number;
  rMultiple: number;
  status: 'OPEN' | 'CLOSED';
}

export interface BacktestSession {
  id: string;
  title: string;
  symbol: string;
  timeframe: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  currentBalance: number;
  trades: BacktestTrade[];
  totalTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  maxDrawdown: number;
  currentIndex: number;
  notes: string;
}

export interface CommunityPost {
  id: string;
  userId?: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  badge?: string;
  timestamp: string;
  content: string;
  symbol?: string;
  direction?: 'BUY' | 'SELL';
  pnl?: string;
  rMultiple?: string;
  imageUrl?: string;
  likes: number;
  hasLiked?: boolean;
  commentsCount: number;
  comments?: {
    id: string;
    author: string;
    avatar: string;
    text: string;
    time: string;
    userId?: string;
  }[];
}

export interface MentorStudent {
  id: string;
  code: string;
  name: string;
  email: string;
  avatar: string;
  accountName: string;
  currentBalance: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  zellaScore: number;
  totalTrades: number;
  status: 'ACTIVE' | 'PENDING' | 'PAUSED';
  sharedAccounts: string[];
  unreadNotesCount: number;
  disciplineScore?: number;
  joinedDate?: string;
  riskBreached?: boolean;
}

export interface MentorConnectionRequest {
  id: string;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  mentorName: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  accountCode: string;
  experienceLevel: string;
  points?: number;
  role?: string;
  isPublic?: boolean;
  avatar?: string;
}

export interface MentorDirective {
  id: string;
  mentorId: string;
  studentId: string;
  type: string;
  content: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt?: string;
}

export type MentorFeedback = MentorDirective;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'TRADE_SYNC' | 'RISK_ALERT' | 'GOAL_ACHIEVED' | 'ECONOMIC_REMINDER' | 'JOURNAL_REMINDER' | 'MENTOR_UPDATE' | 'PROP_FIRM_ALERT';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export type PropFirmRiskState = 'SAFE' | 'WARNING' | 'CRITICAL' | 'BREACHED';
export type PropFirmPhase = 'PHASE_1' | 'PHASE_2' | 'FUNDED' | 'CUSTOM';
export type DrawdownModelType = 'STATIC' | 'EOD_TRAILING' | 'INTRADAY_HWM_TRAILING';
export type DailyDrawdownModelType = 'START_OF_DAY_BALANCE' | 'START_OF_DAY_EQUITY' | 'BALANCE_BASED' | 'EQUITY_BASED';

export type PropFirmRuleType =
  | 'DAILY_DRAWDOWN'
  | 'MAX_DRAWDOWN'
  | 'PROFIT_TARGET'
  | 'MIN_TRADING_DAYS'
  | 'MAX_TRADING_DAYS'
  | 'CONSISTENCY'
  | 'NEWS_RESTRICTION'
  | 'WEEKEND_RESTRICTION'
  | 'MAX_POSITION_SIZE'
  | 'MAX_OPEN_RISK'
  | 'CUSTOM';

export interface PropFirmRule {
  id: string;
  name: string;
  type: PropFirmRuleType;
  description: string;
  enabled: boolean;
  threshold: number;
  unit: 'USD' | 'PERCENT' | 'DAYS' | 'LOTS' | 'CONTRACTS' | 'MINUTES';
  calculationMethodology: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  currentValue?: number;
  status?: 'SAFE' | 'WARNING' | 'CRITICAL' | 'BREACHED' | 'INCOMPLETE' | 'COMPLETED';
  details?: string;
  config?: Record<string, any>;
}

export interface PropFirmViolation {
  id: string;
  accountId: string;
  ruleId: string;
  ruleName: string;
  ruleType: PropFirmRuleType | string;
  timestamp: string;
  relatedTradeId?: string;
  actualValue: number | string;
  allowedValue: number | string;
  severity: 'WARNING' | 'CRITICAL' | 'BREACH';
  explanation: string;
  status: 'ACTIVE' | 'RESOLVED' | 'WAIVED';
}

export interface PropFirmPayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'REQUESTED';
  transactionRef?: string;
  profitSplit: number;
}

export interface PropFirmPayoutInfo {
  eligibilityDate?: string;
  nextPayoutDate?: string;
  minTradingDaysRequired: number;
  tradingDaysCompleted: number;
  profitSplitPercent: number;
  eligibleProfit: number;
  payoutAmount: number;
  payoutHistory: PropFirmPayoutRecord[];
}

export interface PropFirmAccount {
  id: string;
  name: string;
  firmName: string;
  accountNumber?: string;
  startingBalance: number;
  currentBalance: number;
  equity: number;
  highWaterMark?: number;
  phase: PropFirmPhase;
  phaseName?: string;
  status: 'ACTIVE' | 'PASSED' | 'FAILED' | 'PAUSED' | 'ARCHIVED';
  riskState: PropFirmRiskState;
  drawdownModel: DrawdownModelType;
  dailyDrawdownModel: DailyDrawdownModelType;
  sessionTimezone: string; // e.g. 'America/New_York', 'UTC'
  currency: string;
  rules: PropFirmRule[];
  violations: PropFirmViolation[];
  payoutInfo?: PropFirmPayoutInfo;
  tradingAccountLink?: string; // links to TradingAccount id for automatic trade ingestion
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface PreTradeValidationCheck {
  ruleName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  metric?: string;
}

export interface PreTradeValidationResult {
  status: 'APPROVED' | 'WARNING' | 'BLOCKED';
  summary: string;
  checks: PreTradeValidationCheck[];
}

