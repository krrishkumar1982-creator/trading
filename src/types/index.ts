export type MarketType = 'Forex' | 'Futures' | 'Crypto' | 'Stocks' | 'Indices' | 'Commodities';
export type TradeDirection = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';
export type SessionType = 'London' | 'New York' | 'Asian' | 'Pre-Market' | 'After-Hours' | 'Overlap';
export type CurrencyDisplayMode = 'USD' | 'PERCENT' | 'R_MULTIPLE' | 'TICKS' | 'PRIVACY';
export type TradeSource = 'manual' | 'mt5' | 'ctrader' | 'dxtrade' | 'matchtrader' | 'api' | 'csv';

export interface Trade {
  id: string;
  accountId: string;
  connectionId?: string;
  externalTradeId?: string;
  platform?: string;
  broker?: string;
  source?: TradeSource;
  orderId?: string;
  positionId?: string;
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
  setupId?: string;
  setupType: string;
  setupGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  autoGrade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  ruleCompliancePercent?: number;
  checkedRuleIds?: string[];
  brokenRuleIds?: string[];
  mistakeCategory?: string;
  mistakeDescription?: string;
  mistakeSeverity?: 'Low' | 'Medium' | 'High';
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

export type ConnectionPlatform = 'MT5' | 'CTRADER' | 'DXTRADE' | 'MATCH_TRADER' | 'BROKER_API' | 'CSV';
export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'SYNCED' | 'DISCONNECTED' | 'ERROR' | 'REAUTH_REQUIRED';

export interface TradingAccountConnection {
  id: string;
  userId: string;
  accountId: string;
  platform: ConnectionPlatform;
  broker: string;
  server?: string;
  accountNumber: string;
  accountName?: string;
  currency: string;
  accountType: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  connectionStatus: ConnectionStatus;
  syncEnabled: boolean;
  autoSyncIntervalMins: number;
  importScope: 'ALL' | 'DATE';
  importStartDate?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  lastSyncTradesCount: number;
  balance: number;
  equity: number;
  leverage: number;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionSyncLog {
  id: string;
  connectionId: string;
  userId: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SYNCING';
  tradesImported: number;
  tradesUpdated: number;
  errorMessage?: string;
  details?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  createdAt?: string;
}

export interface TradingAccount {
  id: string;
  name: string;
  broker: string;
  accountNumber?: string;
  type: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  currency: string;
  initialBalance: number;
  currentBalance: number;
  isDefault: boolean;
  isArchived?: boolean;
  color?: string;
  createdAt?: string;
  lastSync?: string;
  syncStatus: 'HEALTHY' | 'SYNCING' | 'DISCONNECTED' | 'ERROR';
}

export interface PlaybookRule {
  id: string;
  text: string;
  category: 'ENTRY' | 'EXIT' | 'RISK' | 'MARKET' | 'INVALIDATION';
  required: boolean;
  active?: boolean;
  order?: number;
}

export interface PlaybookSetupCondition {
  id: string;
  text: string;
  required: boolean;
}

export interface PlaybookSetup {
  id: string;
  playbookId?: string;
  name: string;
  description?: string;
  conditions: PlaybookSetupCondition[];
}

export interface Playbook {
  id: string;
  name: string;
  icon: string; // emoji or icon name
  color: string;
  description: string;
  market?: MarketType;
  instrument?: string;
  direction?: 'Long' | 'Short' | 'Both';
  session?: SessionType;
  primaryTimeframe?: string;
  strategyType?: string;
  riskPerTrade?: number; // percentage, e.g. 1%
  minRiskReward?: string; // e.g. "1:2"
  maxTradesPerSession?: number;
  dailyLossLimit?: number;
  status: 'A_PLUS' | 'STANDARD' | 'EXPERIMENTAL' | 'DEPRECATED' | 'Active' | 'Paused' | 'Archived';
  rules: PlaybookRule[];
  setups?: PlaybookSetup[];
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
  createdAt?: string;
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

export interface JournalAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  date?: string;
}

export interface JournalNote {
  id: string;
  accountId: string;
  date: string;
  time?: string;
  title: string;
  folderId: string;
  tags: string[];
  content: string;
  tradeId?: string;
  symbol?: string;
  side?: 'Long' | 'Short' | 'BUY' | 'SELL';
  setup?: string;
  timeframe?: string;
  resultR?: string;
  accountName?: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  attachments?: JournalAttachment[];
  preMarketPlan?: {
    bias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    keyLevels?: string;
    newsEvents?: string;
    maxRiskPerTrade?: string;
    checklist?: { id: string; text: string; checked: boolean }[];
  };
  postMarketReview?: {
    whatWentWell?: string;
    whatWentWrong?: string;
    lessonsLearned?: string;
    disciplineRating?: number; // 1 to 5
    emotionalRating?: number; // 1 to 5
    executionGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  };
  contractsTraded?: number;
  volume?: number;
  netPnl?: number;
  netRoi?: number;
  screenshots?: string[];
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
  id?: string;
  userId?: string;
  tradingAccountId?: string;
  dailyProfitTarget?: number;
  weeklyProfitTarget?: number;
  monthlyProfitTarget?: number;
  maxDailyLoss?: number;
  dailyMaxLoss?: number;
  maxWeeklyLoss?: number;
  maxDrawdown?: number;
  maxDrawdownLimit?: number;
  maxRiskPerTradePercent?: number;
  maxRiskPerTradeAmount?: number;
  maxTradesPerDay?: number;
  maxConsecutiveLosses?: number;
  maxContractsPerTrade?: number;
  maxDailyLossStreak?: number;
  minRMultiple?: number;
  maxPositionSize?: number;
  maxOpenPositions?: number;
  enforceCircuitBreaker?: boolean;
  circuitBreakerTriggered?: boolean;
  circuitBreakerState?: 'DISARMED' | 'ARMED' | 'WARNING' | 'TRIGGERED';
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
  avatarUrl?: string;
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
export type PropFirmPhase = 'PHASE_1' | 'PHASE_2' | 'EVALUATION' | 'FUNDED' | 'SIMULATED_FUNDED' | 'CUSTOM';
export type ProgramModelType = 'TWO_STEP' | 'ONE_STEP' | 'INSTANT_FUNDING' | 'FAST_TRACK' | 'CUSTOM';
export type DrawdownModelType = 'STATIC' | 'EOD_TRAILING' | 'INTRADAY_HWM_TRAILING';
export type DailyDrawdownModelType = 'START_OF_DAY_BALANCE' | 'START_OF_DAY_EQUITY' | 'BALANCE_BASED' | 'EQUITY_BASED' | 'REALIZED_ONLY' | 'REALIZED_PLUS_FLOATING';
export type PropFirmEnforcementMode = 'MONITOR' | 'STRICT';

export type PropFirmRuleType =
  | 'DAILY_DRAWDOWN'
  | 'MAX_DRAWDOWN'
  | 'PROFIT_TARGET'
  | 'MIN_TRADING_DAYS'
  | 'QUALIFYING_DAY'
  | 'MAX_TRADING_DAYS'
  | 'CONSISTENCY'
  | 'SYMBOL_EXPOSURE_RISK'
  | 'MIN_TRADE_DURATION'
  | 'AVG_TRADE_DURATION'
  | 'NEWS_RESTRICTION'
  | 'WEEKEND_RESTRICTION'
  | 'MAX_POSITION_SIZE'
  | 'MAX_OPEN_RISK'
  | 'INACTIVITY'
  | 'PROHIBITED_BEHAVIOR'
  | 'REWARD_BUFFER'
  | 'CUSTOM';

export interface PropFirmRule {
  id: string;
  name: string;
  type: PropFirmRuleType;
  description: string;
  enabled: boolean;
  threshold: number;
  unit: 'USD' | 'PERCENT' | 'DAYS' | 'LOTS' | 'CONTRACTS' | 'MINUTES' | 'SECONDS';
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

export interface PropFirmTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'CREATE' | 'TRADE' | 'PROGRESS' | 'WARNING' | 'BREACH' | 'QUALIFIED_DAY' | 'PHASE_PASS' | 'PAYOUT';
  metadata?: Record<string, any>;
}

export interface PropFirmPayoutRecord {
  id: string;
  date: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  transactionRef?: string;
  profitSplit: number;
  traderShare?: number;
  firmShare?: number;
  notes?: string;
}

export interface PropFirmPayoutInfo {
  eligibilityDate?: string;
  nextPayoutDate?: string;
  minTradingDaysRequired: number;
  tradingDaysCompleted: number;
  profitSplitPercent: number;
  eligibleProfit: number;
  payoutAmount: number;
  rewardBufferPercent?: number;
  rewardBufferMet?: boolean;
  minRequestAmount?: number;
  payoutHistory: PropFirmPayoutRecord[];
}

export interface PropFirmAccount {
  id: string;
  name: string;
  firmName: string;
  legalEntity?: string;
  tradingBrand?: string;
  registrationNumber?: string;
  jurisdiction?: string;
  termsEffectiveDate?: string;
  rulesVersion?: string;
  accountNumber?: string;
  startingBalance: number;
  currentBalance: number;
  equity: number;
  highWaterMark?: number;
  programModel?: ProgramModelType;
  phase: PropFirmPhase;
  phaseName?: string;
  status: 'ACTIVE' | 'WARNING' | 'PASSED' | 'BREACHED' | 'SUSPENDED' | 'COMPLETED' | 'ARCHIVED' | 'FAILED' | 'PAUSED';
  riskState: PropFirmRiskState;
  enforcementMode?: PropFirmEnforcementMode; // MONITOR vs STRICT
  drawdownModel: DrawdownModelType;
  dailyDrawdownModel: DailyDrawdownModelType;
  dailyLossMethod?: 'REALIZED_ONLY' | 'REALIZED_PLUS_FLOATING' | 'START_OF_DAY_EQUITY' | 'START_OF_DAY_BALANCE' | 'CUSTOM';
  maxRiskPerSymbolPercent?: number; // e.g. 2% or 1%
  minTradeDurationSec?: number; // e.g. 60 seconds
  avgTradeDurationSec?: number;
  minTradingDays?: number;
  qualifyingDayProfitPercent?: number; // e.g. 0.5%
  profitTargetPercent?: number; // e.g. 8%, 5%, 10%, 6%
  dailyLossPercent?: number;
  totalLossPercent?: number;
  profitTargetAmount?: number;
  consistencyMaxDayPercent?: number; // e.g. 20%
  rewardBufferPercent?: number; // e.g. 3%
  rewardSplitPercent?: number; // e.g. 80%
  minRewardRequest?: number; // e.g. $100
  activationFee?: number; // Metadata fee: $50, $80, $170, $350, $600
  inactivityMaxDays?: number; // default 30 days
  newsWindowMinutes?: number; // 5 mins before + 5 mins after
  sessionTimezone: string; // e.g. 'America/New_York', 'UTC'
  currency: string;
  rules: PropFirmRule[];
  violations: PropFirmViolation[];
  timeline?: PropFirmTimelineEvent[];
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

// ==========================================
// SELF IMPROVEMENT SYSTEM TYPES
// ==========================================

export type HabitCategory = 'Morning' | 'Productivity' | 'Fitness' | 'Mind' | 'Discipline' | 'Trading' | 'Custom';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly';
export type HabitDifficulty = 'easy' | 'medium' | 'hard';

export interface SelfHabit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  target: string;
  frequency: HabitFrequency;
  reminderTime?: string;
  difficulty: HabitDifficulty;
  weight: number; // 1 to 5
  active: boolean;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  notes?: string;
  completedAt?: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  estimatedDurationMins?: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  scoreContribution: number;
  completedAt?: string;
  createdAt: string;
}

export interface DailyCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  energy: number; // 1-10
  focus: number; // 1-10
  stress: number; // 1-10
  motivation: number; // 1-10
  productivity: number; // 1-10
  notes?: string;
  gratitudes?: string[]; // 1-3 entries
  createdAt: string;
}

export interface MorningCheckin {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleepQuality: number; // 1-10
  energyLevel: number; // 1-10
  mainGoal: string;
  topPriorities: string[];
  workoutPlanned: boolean;
  tradingPlanned: boolean;
  personalGoal: string;
  avoidToday: string;
  generatedMission: string;
  createdAt: string;
}

export interface NightlyReview {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  wentWell: string;
  wentWrong: string;
  learned: string;
  improveTomorrow: string;
  followedPlan: boolean;
  wastedTime: boolean;
  maintainedDiscipline: boolean;
  reflectionScore: number; // 0-100
  createdAt: string;
}

export interface RoutineItem {
  id: string;
  routineId: string;
  title: string;
  time?: string;
  order: number;
}

export interface DailyRoutine {
  id: string;
  userId: string;
  name: string;
  category: 'Morning' | 'Trading' | 'Night' | 'Custom';
  active: boolean;
  items: RoutineItem[];
  createdAt: string;
}

export interface RoutineCompletion {
  id: string;
  userId: string;
  routineId: string;
  itemId: string;
  date: string;
  completed: boolean;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // e.g. "22:45"
  wakeTime: string; // e.g. "06:30"
  durationHours: number; // e.g. 7.75
  quality: number; // 1-10
  targetHours: number; // default 8
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: 'Strength' | 'Cardio' | 'HIIT' | 'Running' | 'Mobility' | 'Sports' | 'Walking';
  durationMins: number;
  steps?: number;
  completed: boolean;
  intensity?: 'Light' | 'Moderate' | 'Intense';
  notes?: string;
}

export interface LearningLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: 'Trading' | 'Psychology' | 'Business' | 'Tech' | 'Philosophy' | 'Health';
  durationMins: number;
  pagesRead?: number;
  notes?: string;
}

export interface DeepWorkSession {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime?: string;
  durationMins: number;
  category: string;
  taskName: string;
  distractionCount: number;
  focusRating: number; // 1-10
}

export interface DistractionLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  socialMediaMins: number;
  youtubeMins: number;
  gamingMins: number;
  entertainmentMins: number;
  randomBrowsingMins: number;
  notes?: string;
}

export interface DisciplineStreakRecord {
  id: string;
  userId: string;
  trackerName: string;
  currentStreakDays: number;
  bestStreakDays: number;
  totalSuccessfulDays: number;
  startDate: string;
  lastCheckinDate: string;
  historyLogs: Array<{ date: string; status: 'CLEAN' | 'RELAPSE'; note?: string; streakAtTime: number }>;
}

export interface PersonalGoal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'Discipline' | 'Trading' | 'Fitness' | 'Mind' | 'Learning' | 'Financial';
  timeframe: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  milestones: Array<{ id: string; title: string; completed: boolean }>;
  createdAt: string;
}

export interface PersonalRule {
  id: string;
  userId: string;
  text: string;
  category: 'TRADING' | 'LIFESTYLE' | 'DISCIPLINE' | 'HEALTH';
  active: boolean;
  order: number;
  verifiedDates: string[]; // dates on which rule was verified
}

export interface GrowthScoreBreakdown {
  totalScore: number;
  disciplineScore: number;
  productivityScore: number;
  physicalScore: number;
  mentalScore: number;
  recoveryScore: number;
  learningScore: number;
  tradingDisciplineScore: number;
  tradingMetrics: {
    riskDiscipline: number;
    ruleCompliance: number;
    overtradingControl: number;
    journalCompletion: number;
    emotionalControl: number;
  };
  streakDays: number;
  yesterdayScore: number;
  sevenDayAvg: number;
  thirtyDayAvg: number;
  bestDayScore: number;
}

export interface GrowthAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Discipline' | 'Habits' | 'DeepWork' | 'Reading' | 'Trading' | 'Consistency';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserGrowthLevel {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  title: string;
}


