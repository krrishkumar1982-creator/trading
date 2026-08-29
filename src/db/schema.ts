import { pgTable, serial, text, timestamp, doublePrecision, integer, boolean, jsonb, unique } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or dev user identifier
  name: text('name').notNull(),
  email: text('email').notNull(),
  accountCode: text('account_code').notNull().unique(),
  experienceLevel: text('experience_level').notNull().default('Intermediate'),
  points: integer('points').notNull().default(100),
  role: text('role').notNull().default('USER'),
  isPublic: boolean('is_public').notNull().default(true),
  avatar: text('avatar').notNull().default('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Trading Accounts table
export const tradingAccounts = pgTable('trading_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  broker: text('broker').notNull(),
  type: text('type').notNull(),
  currency: text('currency').notNull().default('USD'),
  initialBalance: doublePrecision('initial_balance').notNull(),
  currentBalance: doublePrecision('current_balance').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  lastSync: text('last_sync'),
  syncStatus: text('sync_status').notNull().default('HEALTHY'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Trades table
export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id').notNull(),
  symbol: text('symbol').notNull(),
  market: text('market').notNull(),
  direction: text('direction').notNull(),
  status: text('status').notNull(),
  entryDate: text('entry_date').notNull(),
  exitDate: text('exit_date'),
  entryPrice: doublePrecision('entry_price').notNull(),
  exitPrice: doublePrecision('exit_price'),
  stopLoss: doublePrecision('stop_loss'),
  takeProfit: doublePrecision('take_profit'),
  quantity: doublePrecision('quantity').notNull(),
  grossPnl: doublePrecision('gross_pnl').notNull(),
  netPnl: doublePrecision('net_pnl').notNull(),
  commission: doublePrecision('commission').notNull().default(0),
  swap: doublePrecision('swap').notNull().default(0),
  fees: doublePrecision('fees').notNull().default(0),
  rMultiple: doublePrecision('r_multiple').notNull().default(0),
  roiPercent: doublePrecision('roi_percent').notNull().default(0),
  session: text('session').notNull(),
  strategyId: text('strategy_id'),
  playbookId: text('playbook_id'),
  setupType: text('setup_type').notNull(),
  rating: integer('rating').notNull().default(3),
  notes: text('notes').notNull().default(''),
  tags: jsonb('tags').notNull().default([]),
  mistakes: jsonb('mistakes').notNull().default([]),
  rulesFollowed: boolean('rules_followed').notNull().default(true),
  screenshotUrl: text('screenshot_url'),
  afterScreenshotUrl: text('after_screenshot_url'),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  emotionalState: text('emotional_state'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Playbooks table
export const playbooks = pgTable('playbooks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  rules: jsonb('rules').notNull().default([]),
  exampleScreenshots: jsonb('example_screenshots').notNull().default([]),
  totalTrades: integer('total_trades').notNull().default(0),
  winRate: doublePrecision('win_rate').notNull().default(0),
  netPnl: doublePrecision('net_pnl').notNull().default(0),
  profitFactor: doublePrecision('profit_factor').notNull().default(0),
  avgWinner: doublePrecision('avg_winner').notNull().default(0),
  avgLoser: doublePrecision('avg_loser').notNull().default(0),
  expectancy: doublePrecision('expectancy').notNull().default(0),
  missedTradesCount: integer('missed_trades_count').notNull().default(0),
  isPrivate: boolean('is_private').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Strategies table
export const strategies = pgTable('strategies', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  timeframe: text('timeframe').notNull(),
  marketType: text('market_type').notNull(),
  winRate: doublePrecision('win_rate').notNull().default(0),
  totalTrades: integer('total_trades').notNull().default(0),
  netPnl: doublePrecision('net_pnl').notNull().default(0),
  profitFactor: doublePrecision('profit_factor').notNull().default(0),
  rules: jsonb('rules').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Journal Notes table
export const journalNotes = pgTable('journal_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id').notNull(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  folderId: text('folder_id').notNull(),
  tags: jsonb('tags').notNull().default([]),
  content: text('content').notNull().default(''),
  preMarketPlan: jsonb('pre_market_plan').notNull().default({}),
  postMarketReview: jsonb('post_market_review').notNull().default({}),
  contractsTraded: doublePrecision('contracts_traded'),
  volume: doublePrecision('volume'),
  netPnl: doublePrecision('net_pnl'),
  netRoi: doublePrecision('net_roi'),
  screenshots: jsonb('screenshots').notNull().default([]),
  templateUsed: text('template_used'),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Journal Folders table
export const journalFolders = pgTable('journal_folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Risk & Goals Settings table
export const riskGoals = pgTable('risk_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  dailyProfitTarget: doublePrecision('daily_profit_target'),
  weeklyProfitTarget: doublePrecision('weekly_profit_target'),
  monthlyProfitTarget: doublePrecision('monthly_profit_target'),
  maxDailyLoss: doublePrecision('max_daily_loss'),
  dailyMaxLoss: doublePrecision('daily_max_loss'),
  maxWeeklyLoss: doublePrecision('max_weekly_loss'),
  maxDrawdown: doublePrecision('max_drawdown'),
  maxDrawdownLimit: doublePrecision('max_drawdown_limit'),
  maxRiskPerTradePercent: doublePrecision('max_risk_per_trade_percent'),
  maxTradesPerDay: integer('max_trades_per_day'),
  maxConsecutiveLosses: integer('max_consecutive_losses'),
  maxContractsPerTrade: integer('max_contracts_per_trade'),
  enforceCircuitBreaker: boolean('enforce_circuit_breaker').default(false),
  circuitBreakerTriggered: boolean('circuit_breaker_triggered').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Backtesting Sessions table
export const backtestSessions = pgTable('backtest_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  symbol: text('symbol').notNull(),
  timeframe: text('timeframe').notNull(),
  strategy: text('strategy').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  initialBalance: doublePrecision('initial_balance').notNull(),
  currentBalance: doublePrecision('current_balance').notNull(),
  trades: jsonb('trades').notNull().default([]),
  totalTrades: integer('total_trades').notNull().default(0),
  winRate: doublePrecision('win_rate').notNull().default(0),
  netPnl: doublePrecision('net_pnl').notNull().default(0),
  profitFactor: doublePrecision('profit_factor').notNull().default(0),
  maxDrawdown: doublePrecision('max_drawdown').notNull().default(0),
  currentIndex: integer('current_index').notNull().default(0),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Community Posts table
export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  authorName: text('author_name').notNull(),
  authorHandle: text('author_handle').notNull(),
  authorAvatar: text('author_avatar').notNull(),
  badge: text('badge'),
  timestamp: text('timestamp').notNull(),
  content: text('content').notNull(),
  symbol: text('symbol'),
  direction: text('direction'),
  pnl: text('pnl'),
  rMultiple: text('r_multiple'),
  imageUrl: text('image_url'),
  likes: integer('likes').default(0),
  hasLiked: boolean('has_liked').default(false),
  commentsCount: integer('comments_count').default(0),
  comments: jsonb('comments').default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

// Post Likes table
export const postLikes = pgTable('post_likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Post Comments table
export const postComments = pgTable('post_comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull(),
  userId: text('user_id').notNull(),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Mentor Students table
export const mentorStudents = pgTable('mentor_students', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatar: text('avatar').notNull(),
  accountName: text('account_name').notNull(),
  currentBalance: doublePrecision('current_balance').default(0),
  netPnl: doublePrecision('net_pnl').default(0),
  winRate: doublePrecision('win_rate').default(0),
  profitFactor: doublePrecision('profit_factor').default(0),
  zellaScore: integer('zella_score').default(0),
  totalTrades: integer('total_trades').default(0),
  status: text('status').notNull().default('ACTIVE'),
  sharedAccounts: jsonb('shared_accounts').default([]),
  unreadNotesCount: integer('unread_notes_count').default(0),
  disciplineScore: integer('discipline_score').default(0),
  joinedDate: text('joined_date'),
  riskBreached: boolean('risk_breached').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Mentor Directives table
export const mentorDirectives = pgTable('mentor_directives', {
  id: text('id').primaryKey(),
  mentorId: text('mentor_id').notNull(),
  studentId: text('student_id').notNull(),
  type: text('type').notNull().default('DIRECTIVE'),
  content: text('content').notNull(),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const mentorFeedback = mentorDirectives;

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  timestamp: text('timestamp').notNull(),
  read: boolean('read').default(false),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Broker Integrations table
export const brokerIntegrations = pgTable('broker_integrations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id').notNull(),
  provider: text('provider').notNull(), // 'MT4' | 'MT5' | 'TRADINGVIEW' | 'CUSTOM_WEBHOOK'
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('CONNECTED'), // 'CONNECTED' | 'WAITING_FOR_EVENTS' | 'DISCONNECTED' | 'ERROR'
  secretHash: text('secret_hash').notNull(),
  externalAccountId: text('external_account_id'),
  lastSyncAt: text('last_sync_at'),
  lastEventAt: text('last_event_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Integration Events table (for audit trail & idempotency)
export const integrationEvents = pgTable('integration_events', {
  id: text('id').primaryKey(),
  integrationId: text('integration_id').notNull(),
  userId: text('user_id').notNull(),
  externalEventId: text('external_event_id').notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('PROCESSED'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  processingStatus: text('processing_status').notNull().default('RECEIVED'),
  attemptCount: integer('attempt_count').notNull().default(1),
  maxAttempts: integer('max_attempts').notNull().default(5),
  nextRetryAt: timestamp('next_retry_at'),
  lastAttemptAt: timestamp('last_attempt_at'),
  processedAt: timestamp('processed_at'),
  failedAt: timestamp('failed_at'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  correlationId: text('correlation_id'),
  idempotencyKey: text('idempotency_key'),
  sourceIpHash: text('source_ip_hash'),
  provider: text('provider'),
});

// Daily Checklist States table
export const dailyChecklistStates = pgTable('daily_checklist_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  itemId: text('item_id').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  unique('uid_date_item_idx').on(table.userId, table.date, table.itemId)
]);

// Admin Audit Logs table
export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: text('id').primaryKey(),
  adminId: text('admin_id').notNull(),
  targetUserId: text('target_user_id').notNull(),
  action: text('action').notNull(),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Backtest Drawings table
export const backtestDrawings = pgTable('backtest_drawings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  sessionId: text('session_id').default('default'),
  symbol: text('symbol').notNull(),
  timeframe: text('timeframe').default('15m'),
  drawings: jsonb('drawings').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Chart Templates table
export const chartTemplates = pgTable('chart_templates', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  chartType: text('chart_type').notNull().default('CANDLESTICK'),
  indicators: jsonb('indicators').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

