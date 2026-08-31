import { pgTable, serial, text, timestamp, doublePrecision, integer, boolean, jsonb, unique } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Auth UID or dev user identifier
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

// Profiles table (Supabase auth.users profile linkage)
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Matches auth.users.id (UUID)
  fullName: text('full_name').notNull().default(''),
  email: text('email').notNull().default(''),
  accountCode: text('account_code'),
  experienceLevel: text('experience_level').default('Intermediate'),
  avatarUrl: text('avatar_url').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  connectionId: text('connection_id'),
  externalTradeId: text('external_trade_id'),
  platform: text('platform'),
  broker: text('broker'),
  source: text('source').notNull().default('manual'),
  orderId: text('order_id'),
  positionId: text('position_id'),
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
  setupId: text('setup_id'),
  setupType: text('setup_type').notNull(),
  setupGrade: text('setup_grade'),
  autoGrade: text('auto_grade'),
  ruleCompliancePercent: doublePrecision('rule_compliance_percent'),
  checkedRuleIds: jsonb('checked_rule_ids').notNull().default([]),
  brokenRuleIds: jsonb('broken_rule_ids').notNull().default([]),
  mistakeCategory: text('mistake_category'),
  mistakeDescription: text('mistake_description'),
  mistakeSeverity: text('mistake_severity'),
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
  userId: text('user_id').notNull(),
  tradingAccountId: text('trading_account_id'),
  dailyProfitTarget: doublePrecision('daily_profit_target'),
  weeklyProfitTarget: doublePrecision('weekly_profit_target'),
  monthlyProfitTarget: doublePrecision('monthly_profit_target'),
  maxDailyLoss: doublePrecision('max_daily_loss'),
  dailyMaxLoss: doublePrecision('daily_max_loss'),
  maxWeeklyLoss: doublePrecision('max_weekly_loss'),
  maxDrawdown: doublePrecision('max_drawdown'),
  maxDrawdownLimit: doublePrecision('max_drawdown_limit'),
  maxRiskPerTradePercent: doublePrecision('max_risk_per_trade_percent'),
  maxRiskPerTradeAmount: doublePrecision('max_risk_per_trade_amount'),
  maxTradesPerDay: integer('max_trades_per_day'),
  maxConsecutiveLosses: integer('max_consecutive_losses'),
  maxContractsPerTrade: integer('max_contracts_per_trade'),
  maxDailyLossStreak: integer('max_daily_loss_streak'),
  minRMultiple: doublePrecision('min_r_multiple'),
  maxPositionSize: doublePrecision('max_position_size'),
  maxOpenPositions: integer('max_open_positions'),
  enforceCircuitBreaker: boolean('enforce_circuit_breaker').default(false),
  circuitBreakerTriggered: boolean('circuit_breaker_triggered').default(false),
  circuitBreakerState: text('circuit_breaker_state').default('DISARMED'),
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

// Mentor Student Relationships table
export const mentorStudentRelationships = pgTable('mentor_student_relationships', {
  id: text('id').primaryKey(),
  mentorUserId: text('mentor_user_id').notNull(),
  studentUserId: text('student_user_id').notNull(),
  status: text('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Student Sharing Permissions table
export const studentSharingPermissions = pgTable('student_sharing_permissions', {
  id: text('id').primaryKey(),
  studentUserId: text('student_user_id').notNull(),
  mentorUserId: text('mentor_user_id').notNull(),
  sharedAccountIds: jsonb('shared_account_ids').notNull().default([]),
  canViewAccountOverview: boolean('can_view_account_overview').notNull().default(true),
  canViewTrades: boolean('can_view_trades').notNull().default(true),
  canViewAnalytics: boolean('can_view_analytics').notNull().default(true),
  canViewEquityCurve: boolean('can_view_equity_curve').notNull().default(true),
  canViewDrawdown: boolean('can_view_drawdown').notNull().default(true),
  canViewPlaybooks: boolean('can_view_playbooks').notNull().default(false),
  canViewNotes: boolean('can_view_notes').notNull().default(false),
  canViewRiskControls: boolean('can_view_risk_controls').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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

// Trading Account Connections table (Auto-Sync Broker/Platform Connections)
export const tradingAccountConnections = pgTable('trading_account_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id').notNull(),
  platform: text('platform').notNull(), // 'MT5' | 'CTRADER' | 'DXTRADE' | 'MATCH_TRADER' | 'BROKER_API' | 'CSV'
  broker: text('broker').notNull(),
  server: text('server'),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name'),
  currency: text('currency').notNull().default('USD'),
  accountType: text('account_type').notNull().default('LIVE'), // 'LIVE' | 'DEMO' | 'PROP_FIRM'
  encryptedCredentials: text('encrypted_credentials').notNull(), // AES-256-GCM encrypted JSON payload
  connectionStatus: text('connection_status').notNull().default('CONNECTED'), // 'CONNECTED' | 'SYNCING' | 'SYNCED' | 'DISCONNECTED' | 'ERROR' | 'REAUTH_REQUIRED'
  syncEnabled: boolean('sync_enabled').notNull().default(true),
  autoSyncIntervalMins: integer('auto_sync_interval_mins').notNull().default(5),
  importScope: text('import_scope').notNull().default('ALL'), // 'ALL' | 'DATE'
  importStartDate: text('import_start_date'),
  lastSyncAt: text('last_sync_at'),
  lastSyncError: text('last_sync_error'),
  lastSyncTradesCount: integer('last_sync_trades_count').notNull().default(0),
  balance: doublePrecision('balance').default(0),
  equity: doublePrecision('equity').default(0),
  leverage: integer('leverage').default(100),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Connection Sync Logs table (Audit trail for auto-sync events)
export const connectionSyncLogs = pgTable('connection_sync_logs', {
  id: text('id').primaryKey(),
  connectionId: text('connection_id').notNull(),
  userId: text('user_id').notNull(),
  status: text('status').notNull(), // 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SYNCING'
  tradesImported: integer('trades_imported').notNull().default(0),
  tradesUpdated: integer('trades_updated').notNull().default(0),
  errorMessage: text('error_message'),
  details: jsonb('details'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
  durationMs: integer('duration_ms').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// ========================================================
// SELF IMPROVEMENT SYSTEM TABLES
// ========================================================

export const selfHabits = pgTable('self_habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  target: text('target').notNull(),
  frequency: text('frequency').notNull().default('daily'),
  reminderTime: text('reminder_time'),
  difficulty: text('difficulty').notNull().default('medium'),
  weight: integer('weight').notNull().default(1),
  active: boolean('active').notNull().default(true),
  icon: text('icon'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfHabitCompletions = pgTable('self_habit_completions', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  completed: boolean('completed').notNull().default(false),
  value: doublePrecision('value'),
  notes: text('notes'),
  completedAt: text('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfTasks = pgTable('self_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: text('category').notNull().default('General'),
  priority: text('priority').notNull().default('Medium'),
  dueDate: text('due_date').notNull(),
  dueTime: text('due_time'),
  estimatedDurationMins: integer('estimated_duration_mins').default(30),
  status: text('status').notNull().default('Pending'),
  scoreContribution: integer('score_contribution').default(10),
  completedAt: text('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfCheckins = pgTable('self_checkins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  mood: integer('mood').notNull().default(7),
  energy: integer('energy').notNull().default(7),
  focus: integer('focus').notNull().default(7),
  stress: integer('stress').notNull().default(3),
  motivation: integer('motivation').notNull().default(7),
  productivity: integer('productivity').notNull().default(7),
  notes: text('notes').default(''),
  gratitudes: jsonb('gratitudes').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfMorningCheckins = pgTable('self_morning_checkins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  sleepQuality: integer('sleep_quality').notNull().default(8),
  energyLevel: integer('energy_level').notNull().default(8),
  mainGoal: text('main_goal').notNull().default(''),
  topPriorities: jsonb('top_priorities').notNull().default([]),
  workoutPlanned: boolean('workout_planned').default(true),
  tradingPlanned: boolean('trading_planned').default(true),
  personalGoal: text('personal_goal').default(''),
  avoidToday: text('avoid_today').default(''),
  generatedMission: text('generated_mission').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfNightlyReviews = pgTable('self_nightly_reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  wentWell: text('went_well').default(''),
  wentWrong: text('went_wrong').default(''),
  learned: text('learned').default(''),
  improveTomorrow: text('improve_tomorrow').default(''),
  followedPlan: boolean('followed_plan').default(true),
  wastedTime: boolean('wasted_time').default(false),
  maintainedDiscipline: boolean('maintained_discipline').default(true),
  reflectionScore: integer('reflection_score').default(85),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfRoutines = pgTable('self_routines', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Morning'),
  active: boolean('active').notNull().default(true),
  items: jsonb('items').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfRoutineCompletions = pgTable('self_routine_completions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  routineId: text('routine_id').notNull(),
  itemId: text('item_id').notNull(),
  date: text('date').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfSleepLogs = pgTable('self_sleep_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  bedtime: text('bedtime').notNull().default('22:30'),
  wakeTime: text('wake_time').notNull().default('06:30'),
  durationHours: doublePrecision('duration_hours').notNull().default(8.0),
  quality: integer('quality').notNull().default(8),
  targetHours: doublePrecision('target_hours').notNull().default(8.0),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfExerciseLogs = pgTable('self_exercise_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull().default('Strength'),
  durationMins: integer('duration_mins').notNull().default(45),
  steps: integer('steps').default(8000),
  completed: boolean('completed').notNull().default(true),
  intensity: text('intensity').default('Moderate'),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfLearningLogs = pgTable('self_learning_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull().default('Trading'),
  durationMins: integer('duration_mins').notNull().default(30),
  pagesRead: integer('pages_read').default(15),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfDeepWorkSessions = pgTable('self_deep_work_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  durationMins: integer('duration_mins').notNull().default(60),
  category: text('category').notNull().default('Deep Work'),
  taskName: text('task_name').notNull().default('Focus Session'),
  distractionCount: integer('distraction_count').notNull().default(0),
  focusRating: integer('focus_rating').notNull().default(8),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfDistractionLogs = pgTable('self_distraction_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  socialMediaMins: integer('social_media_mins').default(0),
  youtubeMins: integer('youtube_mins').default(0),
  gamingMins: integer('gaming_mins').default(0),
  entertainmentMins: integer('entertainment_mins').default(0),
  randomBrowsingMins: integer('random_browsing_mins').default(0),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfDisciplineStreaks = pgTable('self_discipline_streaks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  trackerName: text('tracker_name').notNull().default('Digital & Purity Discipline'),
  currentStreakDays: integer('current_streak_days').notNull().default(0),
  bestStreakDays: integer('best_streak_days').notNull().default(0),
  totalSuccessfulDays: integer('total_successful_days').notNull().default(0),
  startDate: text('start_date').notNull(),
  lastCheckinDate: text('last_checkin_date').notNull(),
  historyLogs: jsonb('history_logs').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfGoals = pgTable('self_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  category: text('category').notNull().default('Discipline'),
  timeframe: text('timeframe').notNull().default('SHORT_TERM'),
  targetValue: doublePrecision('target_value').notNull().default(100),
  currentValue: doublePrecision('current_value').notNull().default(0),
  unit: text('unit').notNull().default('%'),
  deadline: text('deadline').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'),
  milestones: jsonb('milestones').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfRules = pgTable('self_rules', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  text: text('text').notNull(),
  category: text('category').notNull().default('TRADING'),
  active: boolean('active').notNull().default(true),
  order: integer('order').notNull().default(0),
  verifiedDates: jsonb('verified_dates').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfGrowthScores = pgTable('self_growth_scores', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  score: integer('score').notNull().default(0),
  discipline: integer('discipline').notNull().default(0),
  productivity: integer('productivity').notNull().default(0),
  physical: integer('physical').notNull().default(0),
  mental: integer('mental').notNull().default(0),
  recovery: integer('recovery').notNull().default(0),
  learning: integer('learning').notNull().default(0),
  trading: integer('trading').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfAchievements = pgTable('self_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  category: text('category').notNull(),
  xpReward: integer('xp_reward').notNull().default(50),
  unlocked: boolean('unlocked').notNull().default(false),
  unlockedAt: text('unlocked_at'),
  progress: integer('progress').notNull().default(0),
  maxProgress: integer('max_progress').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const selfUserXp = pgTable('self_user_xp', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  level: integer('level').notNull().default(1),
  currentXp: integer('current_xp').notNull().default(0),
  nextLevelXp: integer('next_level_xp').notNull().default(500),
  title: text('title').notNull().default('Initiate Trader'),
  updatedAt: timestamp('updated_at').defaultNow(),
});



