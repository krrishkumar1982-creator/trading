import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  Trade,
  TradingAccount,
  Playbook,
  Strategy,
  JournalNote,
  JournalFolder,
  EconomicEvent,
  CommunityPost,
  MentorStudent,
  MentorConnectionRequest,
  UserProfile,
  AppNotification,
  RiskGoalSettings,
  CurrencyDisplayMode,
  PropFirmAccount,
  PropFirmViolation,
  PropFirmPayoutRecord,
  TradingAccountConnection,
  SelfHabit,
  HabitCompletion,
  DailyTask,
  DailyCheckin,
  MorningCheckin,
  NightlyReview,
  DailyRoutine,
  RoutineCompletion,
  SleepLog,
  ExerciseLog,
  LearningLog,
  DeepWorkSession,
  DistractionLog,
  DisciplineStreakRecord,
  PersonalGoal,
  PersonalRule,
  GrowthScoreBreakdown,
  GrowthAchievement,
  UserGrowthLevel,
} from '../types';
import { calculatePlaybookMetrics } from '../lib/metrics';
import {
  calculateDailyGrowthScore,
  calculateGrowthLevelAndXp,
  DEFAULT_ACHIEVEMENTS,
} from '../lib/selfImprovementEngine';
import {
  INITIAL_HABITS,
  INITIAL_TASKS,
  INITIAL_ROUTINES,
  INITIAL_DISCIPLINE_STREAK,
  INITIAL_GOALS,
  INITIAL_RULES,
  INITIAL_SLEEP_LOGS,
  INITIAL_EXERCISE_LOGS,
  INITIAL_LEARNING_LOGS,
  INITIAL_DEEP_WORK_SESSIONS,
  INITIAL_CHECKINS,
} from '../data/selfImprovementData';
import {
  INITIAL_ACCOUNTS,
  INITIAL_PLAYBOOKS,
  INITIAL_STRATEGIES,
  INITIAL_TRADES,
  INITIAL_FOLDERS,
  INITIAL_NOTES,
  INITIAL_ECONOMIC_EVENTS,
  INITIAL_RISK_GOALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MENTOR_STUDENTS,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_PROP_FIRM_ACCOUNTS,
} from '../data/mockData';
import {
  fetchInitialState,
  setApiAuthToken,
  saveAccountApi,
  deleteAccountApi,
  saveTradeApi,
  deleteTradeApi,
  bulkDeleteTradesApi,
  bulkEditTradesApi,
  savePlaybookApi,
  deletePlaybookApi,
  saveStrategyApi,
  saveNoteApi,
  deleteNoteApi,
  saveFolderApi,
  deleteFolderApi,
  saveRiskGoalsApi,
  saveNotificationApi,
  fetchCommunityPostsApi,
  saveCommunityPostApi,
  editCommunityPostApi,
  deleteCommunityPostApi,
  toggleLikePostApi,
  fetchPostCommentsApi,
  addPostCommentApi,
  deletePostCommentApi,
  saveMentorStudentApi,
  deleteMentorStudentApi,
  fetchDirectivesApi,
  createDirectiveApi,
  acknowledgeDirectiveApi,
  fetchLeaderboardApi,
  updateUserPointsAdminApi,
  updateUserRoleAdminApi,
  fetchUserProfileApi,
  updateUserProfileApi
} from '../services/apiClient';
import { io } from 'socket.io-client';
import { onAuthStateChange, signOutUser, getSession, getUser } from '../services/supabaseAuth';
import { User, Session } from '@supabase/supabase-js';

export type ActiveView = 
  | 'dashboard'
  | 'trades'
  | 'journal'
  | 'notebook'
  | 'playbook'
  | 'reports'
  | 'advanced-analytics'
  | 'prop-firm'
  | 'mentor-mode'
  | 'goals'
  | 'calendar'
  | 'news'
  | 'ai-coach'
  | 'tools'
  | 'self-improvement'
  | 'lounge'
  | 'integrations'
  | 'settings'
  | 'help';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface TradingContextType {
  // Navigation & View
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  currencyMode: CurrencyDisplayMode;
  setCurrencyMode: (mode: CurrencyDisplayMode) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  
  // Accounts
  accounts: TradingAccount[];
  selectedAccountId: string; // 'all' or accountId
  setSelectedAccountId: (id: string) => void;
  addAccount: (account: Omit<TradingAccount, 'id'>) => void;
  updateAccount: (account: TradingAccount) => void;
  deleteAccount: (id: string) => void;

  // Auto-Sync Trading Account Connections
  connections: TradingAccountConnection[];
  setConnections: React.Dispatch<React.SetStateAction<TradingAccountConnection[]>>;
  refreshState: () => Promise<void>;

  // Prop Firm Accounts & Rule Engine
  propFirmAccounts: PropFirmAccount[];
  selectedPropFirmAccountId: string;
  setSelectedPropFirmAccountId: (id: string) => void;
  addPropFirmAccount: (account: Omit<PropFirmAccount, 'id' | 'createdAt'> | PropFirmAccount) => void;
  updatePropFirmAccount: (account: PropFirmAccount) => void;
  deletePropFirmAccount: (id: string) => void;
  addPropFirmViolation: (accountId: string, violation: Omit<PropFirmViolation, 'id' | 'timestamp'>) => void;
  recordPropFirmPayout: (accountId: string, payout: Omit<PropFirmPayoutRecord, 'id'>) => void;
  
  // Trades
  trades: Trade[];
  filteredTrades: Trade[];
  addTrade: (trade: Omit<Trade, 'id'>) => void;
  updateTrade: (trade: Trade) => void;
  deleteTrade: (id: string) => void;
  duplicateTrade: (id: string) => void;
  bulkDeleteTrades: (ids: string[]) => void;
  bulkEditTrades: (ids: string[], updates: Partial<Trade>) => void;
  importTrades: (newTrades: Array<Omit<Trade, 'id'>>) => void;
  undoLastDelete: () => void;
  canUndo: boolean;
  
  // Trade Selection & Filters
  selectedTrade: Trade | null;
  setSelectedTrade: (trade: Trade | null) => void;
  isAddTradeOpen: boolean;
  setIsAddTradeOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  dateRange: { startDate: string | null; endDate: string | null; presetLabel: string };
  setDateRange: (range: { startDate: string | null; endDate: string | null; presetLabel: string }) => void;
  
  // Playbooks & Strategies
  playbooks: Playbook[];
  addPlaybook: (pb: Omit<Playbook, 'id'>) => void;
  updatePlaybook: (pb: Playbook) => void;
  deletePlaybook: (id: string) => void;
  duplicatePlaybook: (id: string) => void;
  archivePlaybook: (id: string, newStatus?: 'Active' | 'Paused' | 'Archived') => void;
  strategies: Strategy[];
  addStrategy: (strat: Omit<Strategy, 'id'>) => void;
  
  // Journal & Notes
  notes: JournalNote[];
  folders: JournalFolder[];
  selectedNote: JournalNote | null;
  setSelectedNote: (note: JournalNote | null) => void;
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;
  addNote: (note: Omit<JournalNote, 'id'>) => JournalNote;
  updateNote: (note: JournalNote) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string, icon?: string) => void;
  updateFolder: (id: string, name: string, icon?: string) => void;
  deleteFolder: (id: string) => void;
  
  // Risk & Goals
  riskGoals: RiskGoalSettings;
  updateRiskGoals: (goals: Partial<RiskGoalSettings>) => void;
  
  // Economic Calendar
  calendarEvents: EconomicEvent[];
  toggleEventFavorite: (id: string) => void;
  toggleEventReminder: (id: string) => void;
  
  // Notifications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // User Profile & Unique Account Code
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  regenerateAccountCode: () => string;

  // Mentor & Student Connections
  mentorStudents: MentorStudent[];
  mentorRequests: MentorConnectionRequest[];
  activeStudentImpersonation: MentorStudent | null;
  setActiveStudentImpersonation: (st: MentorStudent | null) => void;
  connectStudentByCode: (code: string) => boolean;
  approveMentorRequest: (requestId: string) => void;
  declineMentorRequest: (requestId: string) => void;
  disconnectStudent: (studentId: string) => void;
  mentorDirectivesSent: any[];
  mentorDirectivesReceived: any[];
  dispatchMentorDirective: (studentCode: string, content: string, type?: string) => Promise<void>;
  acknowledgeMentorDirective: (id: string) => Promise<void>;
  
  // Self Improvement System
  habits: SelfHabit[];
  habitCompletions: HabitCompletion[];
  tasks: DailyTask[];
  checkins: DailyCheckin[];
  morningCheckin: MorningCheckin | null;
  nightlyReview: NightlyReview | null;
  routines: DailyRoutine[];
  routineCompletions: RoutineCompletion[];
  sleepLogs: SleepLog[];
  exerciseLogs: ExerciseLog[];
  learningLogs: LearningLog[];
  deepWorkSessions: DeepWorkSession[];
  distractionLogs: DistractionLog[];
  disciplineStreak: DisciplineStreakRecord;
  goals: PersonalGoal[];
  rules: PersonalRule[];
  achievements: GrowthAchievement[];
  userGrowthLevel: UserGrowthLevel;
  selectedImprovementDate: string;
  setSelectedImprovementDate: (date: string) => void;
  currentGrowthScore: GrowthScoreBreakdown;
  toggleHabit: (habitId: string, date?: string) => void;
  addHabit: (habit: Omit<SelfHabit, 'id' | 'createdAt' | 'userId'>) => void;
  updateHabit: (habit: SelfHabit) => void;
  deleteHabit: (id: string) => void;
  toggleTask: (taskId: string) => void;
  addTask: (task: Omit<DailyTask, 'id' | 'createdAt' | 'userId'>) => void;
  updateTask: (task: DailyTask) => void;
  deleteTask: (id: string) => void;
  saveDailyCheckin: (checkin: Omit<DailyCheckin, 'id' | 'createdAt' | 'userId'>) => void;
  saveMorningCheckin: (checkin: Omit<MorningCheckin, 'id' | 'createdAt' | 'userId'>) => void;
  saveNightlyReview: (review: Omit<NightlyReview, 'id' | 'createdAt' | 'userId'>) => void;
  toggleRoutineItem: (routineId: string, itemId: string, date?: string) => void;
  addRoutine: (routine: Omit<DailyRoutine, 'id' | 'createdAt' | 'userId'>) => void;
  updateRoutine: (routine: DailyRoutine) => void;
  deleteRoutine: (id: string) => void;
  logSleep: (log: Omit<SleepLog, 'id' | 'userId'>) => void;
  logExercise: (log: Omit<ExerciseLog, 'id' | 'userId'>) => void;
  logLearning: (log: Omit<LearningLog, 'id' | 'userId'>) => void;
  logDeepWorkSession: (session: Omit<DeepWorkSession, 'id' | 'userId'>) => void;
  logDistraction: (log: Omit<DistractionLog, 'id' | 'userId'>) => void;
  updateDisciplineStreak: (status: 'CLEAN' | 'RELAPSE', note?: string) => void;
  addGoal: (goal: Omit<PersonalGoal, 'id' | 'createdAt' | 'userId'>) => void;
  updateGoal: (goal: PersonalGoal) => void;
  deleteGoal: (id: string) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;
  addRule: (rule: { text: string; category: 'TRADING' | 'LIFESTYLE' | 'DISCIPLINE' | 'HEALTH' }) => void;
  toggleRuleVerification: (ruleId: string, date?: string) => void;
  deleteRule: (id: string) => void;

  // Community Lounge (Preserved for compatibility)
  communityPosts: CommunityPost[];
  currentUserId: string;
  toggleLikePost: (id: string) => Promise<void>;
  addCommunityPost: (content: string, symbol?: string, pnl?: string, rMultiple?: string, imageUrl?: string) => Promise<void>;
  deleteCommunityPost: (id: string) => Promise<void>;
  addPostComment: (postId: string, content: string) => Promise<void>;
  deletePostComment: (postId: string, commentId: string) => Promise<void>;
  leaderboard: any[];
  fetchLeaderboard: () => Promise<void>;
  updateUserPointsAdmin: (userId: string, points: number, reason?: string) => Promise<void>;
  updateUserRoleAdmin: (userId: string, role: string, reason?: string) => Promise<void>;
  
  // Toasts
  toasts: Toast[];
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Formatters
  formatCurrency: (value: number, customMode?: CurrencyDisplayMode) => string;
  formatRMultiple: (r: number) => string;
  
  // Quick Actions & Data Reset
  resetToSampleData: () => void;
  clearAllTradesData: () => void;

  // Real Authentication
  authUser: User | null;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const getViewFromUrl = (): ActiveView => {
  try {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    
    if (path.includes('/analytics/performance') || hash.includes('analytics/performance') || hash.includes('reports')) {
      return 'reports';
    }
    if (path.includes('/analytics/advanced') || hash.includes('analytics/advanced')) {
      return 'advanced-analytics';
    }
    if (path.includes('/trades') || hash.includes('trades')) return 'trades';
    if (path.includes('/journal') || hash.includes('journal') || hash.includes('notebook')) return 'notebook';
    if (path.includes('/playbook') || hash.includes('playbook')) return 'playbook';
    if (path.includes('/prop-firm') || hash.includes('prop-firm') || path.includes('/propfirm') || hash.includes('propfirm') || path.includes('/backtesting') || hash.includes('backtesting')) return 'prop-firm';
    if (path.includes('/goals') || hash.includes('goals')) return 'goals';
    if (path.includes('/calendar') || hash.includes('calendar')) return 'calendar';
    if (path.includes('/news') || hash.includes('news')) return 'news';
    if (path.includes('/coach') || hash.includes('coach')) return 'ai-coach';
    if (path.includes('/tools') || hash.includes('tools')) return 'tools';
    if (path.includes('/self-improvement') || hash.includes('self-improvement') || path.includes('/improvement') || hash.includes('improvement')) return 'self-improvement';
    if (path.includes('/lounge') || hash.includes('lounge')) return 'self-improvement';
    if (path.includes('/settings') || hash.includes('settings')) return 'settings';
  } catch {
    // ignore
  }
  return 'dashboard';
};

export const TradingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>(getViewFromUrl);
  const [currencyMode, setCurrencyMode] = useState<CurrencyDisplayMode>('USD');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('df_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [connections, setConnections] = useState<TradingAccountConnection[]>([]);
  
  // Prop Firm Accounts state scoped per user
  const [propFirmAccounts, setPropFirmAccounts] = useState<PropFirmAccount[]>([]);
  const [selectedPropFirmAccountId, setSelectedPropFirmAccountId] = useState<string>('');

  // Prop Firm Accounts helpers (user-scoped)
  const addPropFirmAccount = (newAcc: Omit<PropFirmAccount, 'id' | 'createdAt'> | PropFirmAccount) => {
    const created: PropFirmAccount = {
      ...newAcc,
      id: 'id' in newAcc && newAcc.id ? newAcc.id : `pf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: 'createdAt' in newAcc && newAcc.createdAt ? newAcc.createdAt : new Date().toISOString(),
    };
    setPropFirmAccounts((prev) => {
      const next = [created, ...prev.filter((a) => a.id !== created.id)];
      if (authUser?.uid) {
        try {
          localStorage.setItem(`tf_prop_firm_accounts_${authUser.uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
    setSelectedPropFirmAccountId(created.id);
  };

  const updatePropFirmAccount = (updated: PropFirmAccount) => {
    setPropFirmAccounts((prev) => {
      const next = prev.map((acc) => (acc.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : acc));
      if (authUser?.uid) {
        try {
          localStorage.setItem(`tf_prop_firm_accounts_${authUser.uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const deletePropFirmAccount = (id: string) => {
    setPropFirmAccounts((prev) => {
      const next = prev.filter((acc) => acc.id !== id);
      if (selectedPropFirmAccountId === id && next.length > 0) {
        setSelectedPropFirmAccountId(next[0].id);
      } else if (selectedPropFirmAccountId === id) {
        setSelectedPropFirmAccountId('');
      }
      if (authUser?.uid) {
        try {
          localStorage.setItem(`tf_prop_firm_accounts_${authUser.uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const addPropFirmViolation = (
    accountId: string,
    violation: Omit<PropFirmViolation, 'id' | 'timestamp'>
  ) => {
    const newViol: PropFirmViolation = {
      ...violation,
      id: `viol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setPropFirmAccounts((prev) => {
      const next = prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, violations: [newViol, ...acc.violations], riskState: newViol.severity === 'BREACH' ? 'BREACHED' : 'CRITICAL' }
          : acc
      );
      if (authUser?.uid) {
        try {
          localStorage.setItem(`tf_prop_firm_accounts_${authUser.uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const recordPropFirmPayout = (
    accountId: string,
    payout: Omit<PropFirmPayoutRecord, 'id'>
  ) => {
    const record: PropFirmPayoutRecord = {
      ...payout,
      id: `pay-${Date.now()}`,
    };
    setPropFirmAccounts((prev) => {
      const next = prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const currentPayoutInfo = acc.payoutInfo || {
          minTradingDaysRequired: 10,
          tradingDaysCompleted: 10,
          profitSplitPercent: 80,
          eligibleProfit: 0,
          payoutAmount: 0,
          payoutHistory: [],
        };
        return {
          ...acc,
          payoutInfo: {
            ...currentPayoutInfo,
            payoutHistory: [record, ...currentPayoutInfo.payoutHistory],
          },
        };
      });
      if (authUser?.uid) {
        try {
          localStorage.setItem(`tf_prop_firm_accounts_${authUser.uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  };
  const [trades, setTrades] = useState<Trade[]>([]);
  const [deletedTradesStack, setDeletedTradesStack] = useState<Trade[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [folders, setFolders] = useState<JournalFolder[]>([]);
  const [selectedNote, setSelectedNote] = useState<JournalNote | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-all');
  const [riskGoals, setRiskGoals] = useState<RiskGoalSettings>({});
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: 'Trader',
    email: '',
    accountCode: '',
    experienceLevel: 'Futures & Equities Trader',
  });

  const [mentorStudents, setMentorStudents] = useState<MentorStudent[]>([]);
  const [mentorDirectivesSent, setMentorDirectivesSent] = useState<any[]>([]);
  const [mentorDirectivesReceived, setMentorDirectivesReceived] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorConnectionRequest[]>([]);

  const [activeStudentImpersonation, setActiveStudentImpersonation] = useState<MentorStudent | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<EconomicEvent[]>(INITIAL_ECONOMIC_EVENTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null; presetLabel: string }>({
    startDate: null,
    endDate: null,
    presetLabel: 'All Dates',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tradeforge_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [apiAuthToken, setApiAuthTokenState] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ==========================================
  // SELF IMPROVEMENT STATE
  // ==========================================
  const [habits, setHabits] = useState<SelfHabit[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_habits');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HABITS;
  });

  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_habit_completions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'hc-1', habitId: 'h-1', userId: 'default', date: new Date().toISOString().split('T')[0], completed: true },
      { id: 'hc-2', habitId: 'h-2', userId: 'default', date: new Date().toISOString().split('T')[0], completed: true },
      { id: 'hc-3', habitId: 'h-3', userId: 'default', date: new Date().toISOString().split('T')[0], completed: true },
      { id: 'hc-4', habitId: 'h-4', userId: 'default', date: new Date().toISOString().split('T')[0], completed: true },
    ];
  });

  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TASKS;
  });

  const [checkins, setCheckins] = useState<DailyCheckin[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_checkins');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CHECKINS;
  });

  const [morningCheckin, setMorningCheckin] = useState<MorningCheckin | null>(() => {
    try {
      const saved = localStorage.getItem('tf_self_morning_checkin');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'mc-today',
      userId: 'default',
      date: new Date().toISOString().split('T')[0],
      sleepQuality: 9,
      energyLevel: 9,
      mainGoal: 'Flawless execution on E-mini setups and full adherence to risk limits.',
      topPriorities: [
        'Wait for liquidity sweep before taking any order',
        'Stop after 3 trades max',
        'Complete afternoon upper body workout',
      ],
      workoutPlanned: true,
      tradingPlanned: true,
      personalGoal: 'Remain completely calm in any market volatility.',
      avoidToday: 'Revenge trading, over-leveraging, and social media distraction.',
      generatedMission: 'Execute with supreme patience, manage risk like an institutional fund manager, and maintain physical power.',
      createdAt: new Date().toISOString(),
    };
  });

  const [nightlyReview, setNightlyReview] = useState<NightlyReview | null>(() => {
    try {
      const saved = localStorage.getItem('tf_self_nightly_review');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [routines, setRoutines] = useState<DailyRoutine[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_routines');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_ROUTINES;
  });

  const [routineCompletions, setRoutineCompletions] = useState<RoutineCompletion[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_routine_completions');
      if (saved) return JSON.parse(saved);
    } catch {}
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: 'rc-1', userId: 'default', routineId: 'rt-morning', itemId: 'rmi-1', date: today, completed: true },
      { id: 'rc-2', userId: 'default', routineId: 'rt-morning', itemId: 'rmi-2', date: today, completed: true },
      { id: 'rc-3', userId: 'default', routineId: 'rt-morning', itemId: 'rmi-3', date: today, completed: true },
      { id: 'rc-4', userId: 'default', routineId: 'rt-morning', itemId: 'rmi-4', date: today, completed: true },
      { id: 'rc-5', userId: 'default', routineId: 'rt-morning', itemId: 'rmi-5', date: today, completed: true },
      { id: 'rc-6', userId: 'default', routineId: 'rt-trading', itemId: 'rti-1', date: today, completed: true },
      { id: 'rc-7', userId: 'default', routineId: 'rt-trading', itemId: 'rti-2', date: today, completed: true },
    ];
  });

  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_sleep_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SLEEP_LOGS;
  });

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_exercise_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_EXERCISE_LOGS;
  });

  const [learningLogs, setLearningLogs] = useState<LearningLog[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_learning_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LEARNING_LOGS;
  });

  const [deepWorkSessions, setDeepWorkSessions] = useState<DeepWorkSession[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_deep_work');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DEEP_WORK_SESSIONS;
  });

  const [distractionLogs, setDistractionLogs] = useState<DistractionLog[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_distraction');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'dl-1', userId: 'default', date: new Date().toISOString().split('T')[0], socialMediaMins: 15, youtubeMins: 20, gamingMins: 0, entertainmentMins: 0, randomBrowsingMins: 10 },
    ];
  });

  const [disciplineStreak, setDisciplineStreak] = useState<DisciplineStreakRecord>(() => {
    try {
      const saved = localStorage.getItem('tf_self_discipline_streak');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DISCIPLINE_STREAK;
  });

  const [goals, setGoals] = useState<PersonalGoal[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_GOALS;
  });

  const [rules, setRules] = useState<PersonalRule[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_rules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RULES;
  });

  const [achievements, setAchievements] = useState<GrowthAchievement[]>(() => {
    try {
      const saved = localStorage.getItem('tf_self_achievements');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACHIEVEMENTS;
  });

  const [selectedImprovementDate, setSelectedImprovementDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Persist Self Improvement state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tf_self_habits', JSON.stringify(habits));
      localStorage.setItem('tf_self_habit_completions', JSON.stringify(habitCompletions));
      localStorage.setItem('tf_self_tasks', JSON.stringify(tasks));
      localStorage.setItem('tf_self_checkins', JSON.stringify(checkins));
      localStorage.setItem('tf_self_routines', JSON.stringify(routines));
      localStorage.setItem('tf_self_routine_completions', JSON.stringify(routineCompletions));
      localStorage.setItem('tf_self_sleep_logs', JSON.stringify(sleepLogs));
      localStorage.setItem('tf_self_exercise_logs', JSON.stringify(exerciseLogs));
      localStorage.setItem('tf_self_learning_logs', JSON.stringify(learningLogs));
      localStorage.setItem('tf_self_deep_work', JSON.stringify(deepWorkSessions));
      localStorage.setItem('tf_self_distraction', JSON.stringify(distractionLogs));
      localStorage.setItem('tf_self_discipline_streak', JSON.stringify(disciplineStreak));
      localStorage.setItem('tf_self_goals', JSON.stringify(goals));
      localStorage.setItem('tf_self_rules', JSON.stringify(rules));
      localStorage.setItem('tf_self_achievements', JSON.stringify(achievements));
      if (morningCheckin) localStorage.setItem('tf_self_morning_checkin', JSON.stringify(morningCheckin));
      if (nightlyReview) localStorage.setItem('tf_self_nightly_review', JSON.stringify(nightlyReview));
    } catch {}
  }, [
    habits, habitCompletions, tasks, checkins, routines, routineCompletions,
    sleepLogs, exerciseLogs, learningLogs, deepWorkSessions, distractionLogs,
    disciplineStreak, goals, rules, achievements, morningCheckin, nightlyReview,
  ]);

  // Dynamic Growth Score calculation for selected date
  const currentGrowthScore = useMemo(() => {
    const todayCheckin = checkins.find(c => c.date === selectedImprovementDate);
    const todaySleep = sleepLogs.find(s => s.date === selectedImprovementDate);
    const todayExercise = exerciseLogs.find(e => e.date === selectedImprovementDate);
    const todayLearning = learningLogs.find(l => l.date === selectedImprovementDate);
    const todayDistraction = distractionLogs.find(d => d.date === selectedImprovementDate);

    const breakdown = calculateDailyGrowthScore({
      date: selectedImprovementDate,
      habits,
      habitCompletions,
      tasks,
      checkin: todayCheckin,
      morningCheckin: morningCheckin?.date === selectedImprovementDate ? morningCheckin : undefined,
      nightlyReview: nightlyReview?.date === selectedImprovementDate ? nightlyReview : undefined,
      routines,
      routineCompletions,
      sleepLog: todaySleep,
      exerciseLog: todayExercise,
      learningLog: todayLearning,
      deepWorkSessions,
      distractionLog: todayDistraction,
      disciplineStreak,
      trades,
      rules,
    });

    // Calculate streak days (count consecutive days with activity/score)
    breakdown.streakDays = disciplineStreak.currentStreakDays || 7;
    return breakdown;
  }, [
    selectedImprovementDate, habits, habitCompletions, tasks, checkins,
    morningCheckin, nightlyReview, routines, routineCompletions,
    sleepLogs, exerciseLogs, learningLogs, deepWorkSessions, distractionLogs,
    disciplineStreak, trades, rules,
  ]);

  // Dynamic User XP & Growth Level calculation
  const userGrowthLevel = useMemo(() => {
    const totalDeepWorkHours = deepWorkSessions.reduce((acc, s) => acc + s.durationMins, 0) / 60;
    const completedHabits = habitCompletions.filter(c => c.completed).length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const completedRoutines = routineCompletions.filter(c => c.completed).length;
    const disciplinedTrades = trades.filter(t => t.rulesFollowed).length;

    return calculateGrowthLevelAndXp({
      completedHabitsCount: completedHabits,
      completedTasksCount: completedTasks,
      completedRoutinesCount: completedRoutines,
      checkinsCount: checkins.length,
      sleepLogsCount: sleepLogs.length,
      exerciseLogsCount: exerciseLogs.length,
      learningLogsCount: learningLogs.length,
      deepWorkHoursTotal: totalDeepWorkHours,
      disciplinedTradesCount: disciplinedTrades,
    });
  }, [habitCompletions, tasks, routineCompletions, checkins, sleepLogs, exerciseLogs, learningLogs, deepWorkSessions, trades]);

  // SELF IMPROVEMENT HANDLERS
  const toggleHabit = (habitId: string, targetDate?: string) => {
    const date = targetDate || selectedImprovementDate;
    setHabitCompletions(prev => {
      const existingIdx = prev.findIndex(c => c.habitId === habitId && c.date === date);
      if (existingIdx >= 0) {
        const next = [...prev];
        const wasCompleted = next[existingIdx].completed;
        next[existingIdx] = {
          ...next[existingIdx],
          completed: !wasCompleted,
          completedAt: !wasCompleted ? new Date().toISOString() : undefined,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            id: `hc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            habitId,
            userId: authUser?.id || 'default',
            date,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        ];
      }
    });
  };

  const addHabit = (newHabit: Omit<SelfHabit, 'id' | 'createdAt' | 'userId'>) => {
    const habit: SelfHabit = {
      ...newHabit,
      id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, habit]);
    addToast('Habit Created', `"${habit.name}" added to daily routine`, 'success');
  };

  const updateHabit = (updated: SelfHabit) => {
    setHabits(prev => prev.map(h => (h.id === updated.id ? updated : h)));
    addToast('Habit Updated', `Updated "${updated.name}"`, 'info');
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitCompletions(prev => prev.filter(c => c.habitId !== id));
    addToast('Habit Deleted', 'Habit removed', 'info');
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          if (nextStatus === 'Completed') {
            try {
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 } });
            } catch {}
          }
          return {
            ...t,
            status: nextStatus,
            completedAt: nextStatus === 'Completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const addTask = (newTask: Omit<DailyTask, 'id' | 'createdAt' | 'userId'>) => {
    const task: DailyTask = {
      ...newTask,
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [task, ...prev]);
    addToast('Task Scheduled', `"${task.title}" added to planner`, 'success');
  };

  const updateTask = (updated: DailyTask) => {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    addToast('Task Updated', `Updated "${updated.title}"`, 'info');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast('Task Removed', 'Task deleted', 'info');
  };

  const saveDailyCheckin = (checkinData: Omit<DailyCheckin, 'id' | 'createdAt' | 'userId'>) => {
    const checkin: DailyCheckin = {
      ...checkinData,
      id: `ci-${Date.now()}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setCheckins(prev => [checkin, ...prev.filter(c => c.date !== checkin.date)]);
    addToast('Check-in Saved', 'Mind & Wellbeing assessment recorded', 'success');
  };

  const saveMorningCheckin = (morningData: Omit<MorningCheckin, 'id' | 'createdAt' | 'userId'>) => {
    const morning: MorningCheckin = {
      ...morningData,
      id: `mc-${Date.now()}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setMorningCheckin(morning);
    addToast('Morning Mission Locked', 'Daily priorities and focus set', 'success');
  };

  const saveNightlyReview = (reviewData: Omit<NightlyReview, 'id' | 'createdAt' | 'userId'>) => {
    const review: NightlyReview = {
      ...reviewData,
      id: `nr-${Date.now()}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setNightlyReview(review);
    addToast('Nightly Review Saved', 'Daily reflection recorded', 'success');
  };

  const toggleRoutineItem = (routineId: string, itemId: string, targetDate?: string) => {
    const date = targetDate || selectedImprovementDate;
    setRoutineCompletions(prev => {
      const idx = prev.findIndex(c => c.routineId === routineId && c.itemId === itemId && c.date === date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], completed: !next[idx].completed };
        return next;
      } else {
        return [
          ...prev,
          {
            id: `rc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId: authUser?.id || 'default',
            routineId,
            itemId,
            date,
            completed: true,
          },
        ];
      }
    });
  };

  const addRoutine = (newRoutine: Omit<DailyRoutine, 'id' | 'createdAt' | 'userId'>) => {
    const routine: DailyRoutine = {
      ...newRoutine,
      id: `rt-${Date.now()}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setRoutines(prev => [...prev, routine]);
    addToast('Routine Created', `"${routine.name}" configured`, 'success');
  };

  const updateRoutine = (updated: DailyRoutine) => {
    setRoutines(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    addToast('Routine Updated', `Updated "${updated.name}"`, 'info');
  };

  const deleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
    setRoutineCompletions(prev => prev.filter(c => c.routineId !== id));
    addToast('Routine Removed', 'Routine deleted', 'info');
  };

  const logSleep = (logData: Omit<SleepLog, 'id' | 'userId'>) => {
    const log: SleepLog = {
      ...logData,
      id: `sl-${Date.now()}`,
      userId: authUser?.id || 'default',
    };
    setSleepLogs(prev => [log, ...prev.filter(s => s.date !== log.date)]);
    addToast('Sleep Logged', `${log.durationHours}h of sleep recorded (${log.quality}/10 quality)`, 'success');
  };

  const logExercise = (logData: Omit<ExerciseLog, 'id' | 'userId'>) => {
    const log: ExerciseLog = {
      ...logData,
      id: `el-${Date.now()}`,
      userId: authUser?.id || 'default',
    };
    setExerciseLogs(prev => [log, ...prev.filter(e => e.date !== log.date)]);
    addToast('Workout Logged', `${log.durationMins}m ${log.type} session recorded`, 'success');
  };

  const logLearning = (logData: Omit<LearningLog, 'id' | 'userId'>) => {
    const log: LearningLog = {
      ...logData,
      id: `ll-${Date.now()}`,
      userId: authUser?.id || 'default',
    };
    setLearningLogs(prev => [log, ...prev.filter(l => l.date !== log.date)]);
    addToast('Learning Logged', `Recorded "${log.title}"`, 'success');
  };

  const logDeepWorkSession = (sessionData: Omit<DeepWorkSession, 'id' | 'userId'>) => {
    const session: DeepWorkSession = {
      ...sessionData,
      id: `dw-${Date.now()}`,
      userId: authUser?.id || 'default',
    };
    setDeepWorkSessions(prev => [session, ...prev]);
    addToast('Deep Work Completed', `${session.durationMins}m uninterrupted session logged`, 'success');
  };

  const logDistraction = (logData: Omit<DistractionLog, 'id' | 'userId'>) => {
    const log: DistractionLog = {
      ...logData,
      id: `dl-${Date.now()}`,
      userId: authUser?.id || 'default',
    };
    setDistractionLogs(prev => [log, ...prev.filter(d => d.date !== log.date)]);
    addToast('Distraction Logged', 'Digital screen usage updated', 'info');
  };

  const updateDisciplineStreak = (status: 'CLEAN' | 'RELAPSE', note?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setDisciplineStreak(prev => {
      const nextDays = status === 'CLEAN' ? prev.currentStreakDays + 1 : 0;
      const nextBest = Math.max(prev.bestStreakDays, nextDays);
      const nextTotal = status === 'CLEAN' ? prev.totalSuccessfulDays + 1 : prev.totalSuccessfulDays;
      const newLog = { date: today, status, note, streakAtTime: nextDays };
      const updatedLogs = [newLog, ...prev.historyLogs.filter(h => h.date !== today)];

      return {
        ...prev,
        currentStreakDays: nextDays,
        bestStreakDays: nextBest,
        totalSuccessfulDays: nextTotal,
        lastCheckinDate: today,
        historyLogs: updatedLogs,
      };
    });

    if (status === 'CLEAN') {
      addToast('Discipline Streak Extended', 'Clean day confirmed. Unbreakable focus maintained.', 'success');
    } else {
      addToast('Streak Reset', 'Discipline reset. Acknowledge the trigger, learn, and rebuild instantly.', 'warning');
    }
  };

  const addGoal = (newGoal: Omit<PersonalGoal, 'id' | 'createdAt' | 'userId'>) => {
    const goal: PersonalGoal = {
      ...newGoal,
      id: `g-${Date.now()}`,
      userId: authUser?.id || 'default',
      createdAt: new Date().toISOString(),
    };
    setGoals(prev => [...prev, goal]);
    addToast('Goal Created', `"${goal.title}" added to milestones`, 'success');
  };

  const updateGoal = (updated: PersonalGoal) => {
    setGoals(prev => prev.map(g => (g.id === updated.id ? updated : g)));
    addToast('Goal Updated', `Updated "${updated.title}"`, 'info');
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    addToast('Goal Deleted', 'Goal removed', 'info');
  };

  const toggleGoalMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const milestones = g.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = milestones.filter(m => m.completed).length;
          const pct = milestones.length > 0 ? (completedCount / milestones.length) * 100 : g.currentValue;
          return {
            ...g,
            milestones,
            currentValue: Math.round(pct),
            status: pct >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
          };
        }
        return g;
      })
    );
  };

  const addRule = (newRule: { text: string; category: 'TRADING' | 'LIFESTYLE' | 'DISCIPLINE' | 'HEALTH' }) => {
    const rule: PersonalRule = {
      id: `rule-${Date.now()}`,
      userId: authUser?.id || 'default',
      text: newRule.text,
      category: newRule.category,
      active: true,
      order: rules.length + 1,
      verifiedDates: [selectedImprovementDate],
    };
    setRules(prev => [...prev, rule]);
    addToast('Personal Rule Added', 'Rule enshrined in personal code', 'success');
  };

  const toggleRuleVerification = (ruleId: string, targetDate?: string) => {
    const date = targetDate || selectedImprovementDate;
    setRules(prev =>
      prev.map(r => {
        if (r.id === ruleId) {
          const verified = r.verifiedDates || [];
          const nextDates = verified.includes(date)
            ? verified.filter(d => d !== date)
            : [...verified, date];
          return { ...r, verifiedDates: nextDates };
        }
        return r;
      })
    );
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    addToast('Rule Removed', 'Personal rule deleted', 'info');
  };

  const currentUserId = authUser?.id || (authUser as any)?.uid || 'default_user_1';
  const currentUserIdRef = useRef(currentUserId);
  const userAccountCodeRef = useRef(userProfile.accountCode);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
    userAccountCodeRef.current = userProfile.accountCode;
  }, [currentUserId, userProfile.accountCode]);

  // Real-time Socket.IO listener for Community Lounge
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      auth: {
        token: apiAuthToken,
      },
    });

    socket.on('community:post_created', ({ post }: { post: CommunityPost }) => {
      setCommunityPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) {
          return prev.map((p) => (p.id === post.id ? { ...p, ...post } : p));
        }
        return [post, ...prev];
      });
    });

    socket.on('community:post_updated', ({ postId, post }: { postId: string; post: CommunityPost }) => {
      setCommunityPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...post } : p))
      );
    });

    socket.on('community:post_deleted', ({ postId }: { postId: string }) => {
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
    });

    socket.on('community:like_toggled', ({ postId, likes, userId: likerUserId, liked }: { postId: string; likes: number; userId: string; liked: boolean }) => {
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isMe = currentUserIdRef.current === likerUserId;
            return {
              ...p,
              likes,
              hasLiked: isMe ? liked : p.hasLiked,
            };
          }
          return p;
        })
      );
    });

    socket.on('community:comment_added', ({ postId, comment, commentsCount }: { postId: string; comment: any; commentsCount: number }) => {
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const existingComments = p.comments || [];
            const commentExists = existingComments.some((c) => c.id === comment.id);
            const newComments = commentExists ? existingComments : [...existingComments, comment];
            return {
              ...p,
              commentsCount: Math.max(commentsCount, newComments.length),
              comments: newComments,
            };
          }
          return p;
        })
      );
    });

    socket.on('community:comment_deleted', ({ postId, commentId, commentsCount }: { postId: string; commentId: string; commentsCount: number }) => {
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const newComments = (p.comments || []).filter((c) => c.id !== commentId);
            return {
              ...p,
              commentsCount: Math.max(commentsCount, newComments.length),
              comments: newComments,
            };
          }
          return p;
        })
      );
    });

    socket.on('user_trade_synced', ({ trade, provider }: { trade: Trade; accountId: string; provider: string }) => {
      setTrades((prev) => {
        const exists = prev.some((t) => t.id === trade.id);
        if (exists) {
          return prev.map((t) => (t.id === trade.id ? { ...t, ...trade } : t));
        }
        return [trade, ...prev];
      });

      addToast(
        `Auto-Sync Execution (${provider || 'Broker'})`,
        `${trade.symbol} ${trade.direction} trade ${trade.status === 'CLOSED' ? `closed (${trade.netPnl >= 0 ? '+' : ''}$${trade.netPnl.toFixed(2)})` : 'opened'}`,
        trade.netPnl >= 0 ? 'success' : 'info'
      );

      if (trade.status === 'CLOSED' && trade.netPnl > 200) {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }
    });

    socket.on('mentor_directive_created', (directive: any) => {
      if (directive.mentorId === currentUserIdRef.current) {
        setMentorDirectivesSent((prev) => {
          if (prev.some((d) => d.id === directive.id)) return prev;
          return [directive, ...prev];
        });
      }
      if (directive.studentId === currentUserIdRef.current || (userAccountCodeRef.current && directive.studentId === userAccountCodeRef.current)) {
        setMentorDirectivesReceived((prev) => {
          if (prev.some((d) => d.id === directive.id)) return prev;
          return [directive, ...prev];
        });
        addToast(
          'New Coach Directive Received',
          `Your coach has issued a new trading directive: "${directive.content.substring(0, 45)}${directive.content.length > 45 ? '...' : ''}"`,
          'info'
        );
      }
    });

    socket.on('mentor_directive_updated', (directive: any) => {
      if (directive.mentorId === currentUserIdRef.current) {
        setMentorDirectivesSent((prev) =>
          prev.map((d) => (d.id === directive.id ? directive : d))
        );
      }
      if (directive.studentId === currentUserIdRef.current || (userAccountCodeRef.current && directive.studentId === userAccountCodeRef.current)) {
        setMentorDirectivesReceived((prev) =>
          prev.map((d) => (d.id === directive.id ? directive : d))
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [apiAuthToken]);

  const logout = async () => {
    try {
      localStorage.removeItem('tradeforge_authenticated');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setApiAuthToken(null);
    setApiAuthTokenState(null);
    setAuthUser(null);
    setAccounts([]);
    setConnections([]);
    setTrades([]);
    setPlaybooks([]);
    setStrategies([]);
    setNotes([]);
    setFolders([]);
    setSelectedNote(null);
    setPropFirmAccounts([]);
    setSelectedPropFirmAccountId('');
    setMentorStudents([]);
    setMentorDirectivesSent([]);
    setMentorDirectivesReceived([]);
    setRiskGoals({});
    setUserProfile({
      id: '',
      name: 'Trader',
      email: '',
      accountCode: '',
      experienceLevel: 'Trader',
    });
    try {
      localStorage.removeItem('tradeforge_authenticated');
    } catch {}
    await signOutUser();
    addToast('Signed Out', 'You have been signed out', 'info');
  };

  // Listen to Supabase Auth state changes and load user-isolated data
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Reset state completely for clean user switching / logout
      setAccounts([]);
      setConnections([]);
      setTrades([]);
      setPlaybooks([]);
      setStrategies([]);
      setNotes([]);
      setFolders([]);
      setSelectedNote(null);
      setPropFirmAccounts([]);
      setSelectedPropFirmAccountId('');
      setMentorStudents([]);
      setMentorDirectivesSent([]);
      setMentorDirectivesReceived([]);
      setRiskGoals({});

      if (session?.user) {
        const user = session.user;
        const token = session.access_token;
        setApiAuthToken(token);
        setApiAuthTokenState(token);
        setAuthUser(user);
        setIsAuthenticated(true);

        try {
          localStorage.setItem('tradeforge_authenticated', 'true');
          // Load user-scoped prop firm accounts
          const userPropKey = `tf_prop_firm_accounts_${user.id}`;
          const savedProps = localStorage.getItem(userPropKey);
          if (savedProps) {
            const parsed = JSON.parse(savedProps);
            if (Array.isArray(parsed)) {
              setPropFirmAccounts(parsed);
              if (parsed.length > 0) setSelectedPropFirmAccountId(parsed[0].id);
            }
          }
        } catch {
          // ignore
        }

        const initialName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Trader';

        setUserProfile({
          id: user.id,
          name: initialName,
          email: user.email || '',
          accountCode: '',
          experienceLevel: 'Intermediate',
        });

        const data = await fetchInitialState();
        if (!isMounted || !data || !data.success) return;

        if (data.profile) {
          setUserProfile((prev) => ({
            ...prev,
            id: data.profile.id || user.id,
            name: data.profile.name || initialName,
            email: data.profile.email || user.email || '',
            accountCode: data.profile.accountCode || '',
            experienceLevel: data.profile.experienceLevel || prev.experienceLevel,
            avatarUrl: data.profile.avatarUrl,
          }));
        }

        if (Array.isArray(data.accounts)) setAccounts(data.accounts);
        if (Array.isArray(data.connections)) setConnections(data.connections);
        if (Array.isArray(data.trades)) setTrades(data.trades);
        if (Array.isArray(data.playbooks)) setPlaybooks(data.playbooks);
        if (Array.isArray(data.strategies)) setStrategies(data.strategies);
        if (Array.isArray(data.notes)) {
          setNotes(data.notes);
          if (data.notes.length > 0) setSelectedNote(data.notes[0]);
        }
        if (Array.isArray(data.folders)) setFolders(data.folders);
        if (data.riskGoals && typeof data.riskGoals === 'object') {
          setRiskGoals((prev) => ({ ...prev, ...data.riskGoals }));
        }
        if (Array.isArray(data.notifications)) setNotifications(data.notifications);
        if (Array.isArray(data.communityPosts)) setCommunityPosts(data.communityPosts);
        if (Array.isArray(data.mentorStudents)) setMentorStudents(data.mentorStudents);
        if (Array.isArray(data.mentorDirectivesSent)) setMentorDirectivesSent(data.mentorDirectivesSent);
        if (Array.isArray(data.mentorDirectivesReceived)) setMentorDirectivesReceived(data.mentorDirectivesReceived);
        
        // Load leaderboard from real persistent database
        fetchLeaderboard();
      } else {
        setApiAuthToken(null);
        setApiAuthTokenState(null);
        setAuthUser(null);
        setIsAuthenticated(false);
        setUserProfile({
          id: '',
          name: 'Trader',
          email: '',
          accountCode: '',
          experienceLevel: 'Trader',
        });
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  // Theme effect
  useEffect(() => {
    try {
      localStorage.setItem('df_theme', theme);
    } catch {
      // ignore
    }
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-liquid-glass', 'dark', 'light');
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-liquid-glass', 'dark', 'light');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark', 'theme-dark');
      document.body.classList.add('theme-dark', 'dark');
    } else {
      document.documentElement.classList.add('light', 'theme-light');
      document.body.classList.add('theme-light', 'light');
    }
  }, [theme]);

  // URL sync
  useEffect(() => {
    try {
      let targetPath = '/';
      if (activeView === 'reports') targetPath = '/analytics/performance';
      else if (activeView === 'advanced-analytics') targetPath = '/analytics/advanced';
      else if (activeView === 'trades') targetPath = '/trades';
      else if (activeView === 'notebook' || activeView === 'journal') targetPath = '/journal';
      else if (activeView === 'playbook') targetPath = '/playbook';
      else if (activeView === 'prop-firm') targetPath = '/prop-firm';
      else if (activeView === 'mentor-mode') targetPath = '/mentor';
      else if (activeView === 'goals') targetPath = '/goals';
      else if (activeView === 'calendar') targetPath = '/calendar';
      else if (activeView === 'news') targetPath = '/news';
      else if (activeView === 'ai-coach') targetPath = '/coach';
      else if (activeView === 'tools') targetPath = '/tools';
      else if (activeView === 'lounge') targetPath = '/lounge';
      else if (activeView === 'settings' || activeView === 'integrations') targetPath = '/settings';

      if (window.location.pathname !== targetPath && window.history.pushState) {
        window.history.pushState({ view: activeView }, '', targetPath);
      }
    } catch {
      // ignore
    }
  }, [activeView]);

  useEffect(() => {
    const handlePopState = () => {
      const derived = getViewFromUrl();
      setActiveView(derived);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const addToast = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = 't-' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const merged = { ...prev, ...profile };
      updateUserProfileApi({
        fullName: merged.name,
        name: merged.name,
        email: merged.email,
        accountCode: merged.accountCode || undefined,
        experienceLevel: merged.experienceLevel,
        avatarUrl: merged.avatarUrl,
      }).catch(e => console.warn('Failed to sync profile update to database:', e));
      return merged;
    });
    addToast('Profile Updated', 'User profile settings saved', 'success');
  };

  const regenerateAccountCode = (): string => {
    addToast('Feature Disabled', 'Regenerating mentor code is disabled to ensure code stability', 'warning');
    return userProfile.accountCode;
  };

  const connectStudentByCode = (rawCode: string): boolean => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) {
      addToast('Error', 'Please enter a valid unique account code', 'error');
      return false;
    }

    const existing = mentorStudents.find(s => s.code.toUpperCase() === cleanCode);
    if (existing) {
      addToast('Already Connected', `${existing.name} is already in your Mentor Hub`, 'warning');
      return false;
    }

    const newStudent: MentorStudent = {
      id: 'st-' + Date.now(),
      code: cleanCode,
      name: `Trader (${cleanCode})`,
      email: `trader.${cleanCode.toLowerCase()}@duskflow.trade`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      accountName: 'Apex 50k Express',
      currentBalance: 51850.00,
      netPnl: 1850.00,
      winRate: 58.40,
      profitFactor: 2.15,
      zellaScore: 85,
      totalTrades: 28,
      status: 'ACTIVE',
      sharedAccounts: ['Primary Account'],
      unreadNotesCount: 1,
      disciplineScore: 82,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      riskBreached: false,
    };

    setMentorStudents(prev => [newStudent, ...prev]);
    saveMentorStudentApi(newStudent);
    addToast('Student Added', `Account ${cleanCode} connected to your Mentor Workspace!`, 'success');
    return true;
  };

  const approveMentorRequest = (requestId: string) => {
    setMentorRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'APPROVED' } : r));
    addToast('Request Approved', 'Your mentor now has access to review your journal & trades', 'success');
  };

  const declineMentorRequest = (requestId: string) => {
    setMentorRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'DECLINED' } : r));
    addToast('Request Declined', 'Mentor access request declined', 'info');
  };

  const disconnectStudent = (studentId: string) => {
    setMentorStudents(prev => prev.filter(s => s.id !== studentId));
    deleteMentorStudentApi(studentId);
    if (activeStudentImpersonation?.id === studentId) {
      setActiveStudentImpersonation(null);
    }
    addToast('Student Disconnected', 'Student removed from your Mentor Hub', 'info');
  };

  const dispatchMentorDirective = async (studentCode: string, content: string, type = 'DIRECTIVE') => {
    try {
      const data = await createDirectiveApi(studentCode, content, type);
      if (data && data.success && data.directive) {
        setMentorDirectivesSent((prev) => {
          if (prev.some((d) => d.id === data.directive.id)) return prev;
          return [data.directive, ...prev];
        });
        addToast(
          'Directive Dispatched',
          `Direct mentor directive dispatched to student ${studentCode}`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('dispatchMentorDirective error:', err);
      addToast('Dispatch Failed', err.message || 'Failed to dispatch directive', 'error');
      throw err;
    }
  };

  const acknowledgeMentorDirective = async (id: string) => {
    try {
      const data = await acknowledgeDirectiveApi(id);
      if (data && data.success) {
        setMentorDirectivesReceived((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'ACKNOWLEDGED' } : d))
        );
        addToast('Directive Acknowledged', 'You have marked this directive as read and acknowledged.', 'success');
      }
    } catch (err: any) {
      console.error('acknowledgeMentorDirective error:', err);
      addToast('Acknowledge Failed', err.message || 'Failed to acknowledge directive', 'error');
      throw err;
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const data = await fetchLeaderboardApi();
      if (data && data.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      console.warn('fetchLeaderboard note:', err?.message || err);
    }
  };

  const updateUserPointsAdmin = async (userId: string, points: number, reason?: string) => {
    try {
      const data = await updateUserPointsAdminApi(userId, points, reason);
      if (data && data.success) {
        addToast('Points Updated', `Successfully updated trader's points to ${points}`, 'success');
        await fetchLeaderboard();
      }
    } catch (err: any) {
      console.error('updateUserPointsAdmin error:', err);
      addToast('Update Failed', err.message || 'Failed to update points', 'error');
      throw err;
    }
  };

  const updateUserRoleAdmin = async (userId: string, role: string, reason?: string) => {
    try {
      const data = await updateUserRoleAdminApi(userId, role, reason);
      if (data && data.success) {
        addToast('Role Updated', `Successfully updated trader's role to ${role}`, 'success');
        await fetchLeaderboard();
      }
    } catch (err: any) {
      console.error('updateUserRoleAdmin error:', err);
      addToast('Update Failed', err.message || 'Failed to update role', 'error');
      throw err;
    }
  };

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (selectedAccountId !== 'all') {
      result = result.filter(t => t.accountId === selectedAccountId);
    }
    if (dateRange.startDate) {
      const start = new Date(dateRange.startDate + 'T00:00:00');
      result = result.filter(t => {
        if (!t.entryDate) return true;
        const entry = new Date(t.entryDate);
        return entry >= start;
      });
    }
    if (dateRange.endDate) {
      const end = new Date(dateRange.endDate + 'T23:59:59');
      result = result.filter(t => {
        if (!t.entryDate) return true;
        const entry = new Date(t.entryDate);
        return entry <= end;
      });
    }
    return result;
  }, [trades, selectedAccountId, dateRange]);

  const computedPlaybooks = useMemo(() => {
    return playbooks.map(pb => {
      const pbTrades = trades.filter(t => {
        if (t.status !== 'CLOSED') return false;
        if (t.playbookId === pb.id) return true;
        if (t.setupType && pb.name && t.setupType.trim().toLowerCase() === pb.name.trim().toLowerCase()) return true;
        return false;
      });
      const metrics = calculatePlaybookMetrics(pbTrades);

      return {
        ...pb,
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate,
        netPnl: metrics.netPnl,
        profitFactor: metrics.profitFactor,
        avgWinner: metrics.avgWinner,
        avgLoser: metrics.avgLoser,
        expectancy: metrics.expectancy,
      };
    });
  }, [playbooks, trades]);

  const computedStrategies = useMemo(() => {
    return strategies.map(strat => {
      const stratTrades = trades.filter(t => {
        if (t.status !== 'CLOSED') return false;
        if (t.strategyId === strat.id) return true;
        if (t.setupType && strat.name && t.setupType.trim().toLowerCase() === strat.name.trim().toLowerCase()) return true;
        return false;
      });
      const metrics = calculatePlaybookMetrics(stratTrades);

      return {
        ...strat,
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate,
        netPnl: metrics.netPnl,
        profitFactor: metrics.profitFactor,
      };
    });
  }, [strategies, trades]);

  // Trade CRUD
  const addTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: 'tr-' + Date.now(),
    };
    setTrades(prev => [newTrade, ...prev]);
    saveTradeApi(newTrade);
    addToast('Trade Added', `${newTrade.symbol} ${newTrade.direction} trade logged successfully`, 'success');
    if (newTrade.netPnl > 500) {
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    }
  };

  const updateTrade = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => (t.id === updatedTrade.id ? updatedTrade : t)));
    saveTradeApi(updatedTrade);
    addToast('Trade Updated', `Trade #${updatedTrade.symbol} saved`, 'success');
  };

  const deleteTrade = (id: string) => {
    const toDelete = trades.find(t => t.id === id);
    if (toDelete) {
      setDeletedTradesStack(prev => [...prev, toDelete]);
      setTrades(prev => prev.filter(t => t.id !== id));
      deleteTradeApi(id);
      addToast('Trade Deleted', 'Trade removed. You can undo this action.', 'warning');
    }
  };

  const duplicateTrade = (id: string) => {
    const target = trades.find(t => t.id === id);
    if (target) {
      const duplicated: Trade = {
        ...target,
        id: 'tr-' + Date.now(),
        entryDate: new Date().toISOString(),
        notes: `Copy of ${target.symbol} - ${target.notes}`,
      };
      setTrades(prev => [duplicated, ...prev]);
      saveTradeApi(duplicated);
      addToast('Trade Duplicated', `${duplicated.symbol} trade duplicated`, 'info');
    }
  };

  const bulkDeleteTrades = (ids: string[]) => {
    const toDelete = trades.filter(t => ids.includes(t.id));
    setDeletedTradesStack(prev => [...prev, ...toDelete]);
    setTrades(prev => prev.filter(t => !ids.includes(t.id)));
    bulkDeleteTradesApi(ids);
    addToast('Bulk Deleted', `${ids.length} trades deleted`, 'warning');
  };

  const bulkEditTrades = (ids: string[], updates: Partial<Trade>) => {
    setTrades(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
    bulkEditTradesApi(ids, updates);
    addToast('Bulk Updated', `${ids.length} trades updated`, 'success');
  };

  const importTrades = (newTrades: Array<Omit<Trade, 'id'>>) => {
    const formatted = newTrades.map((t, idx) => ({
      ...t,
      id: `tr-imp-${Date.now()}-${idx}`,
    }));
    setTrades(prev => [...formatted, ...prev]);
    for (const tr of formatted) {
      saveTradeApi(tr);
    }
    addToast('Import Successful', `${formatted.length} trades imported cleanly`, 'success');
  };

  const undoLastDelete = () => {
    if (deletedTradesStack.length === 0) return;
    const last = deletedTradesStack[deletedTradesStack.length - 1];
    setDeletedTradesStack(prev => prev.slice(0, -1));
    setTrades(prev => [last, ...prev]);
    saveTradeApi(last);
    addToast('Restored', `Trade #${last.symbol} restored`, 'info');
  };

  // Accounts CRUD
  const addAccount = (acc: Omit<TradingAccount, 'id'>) => {
    const newAcc: TradingAccount = { ...acc, id: 'acc-' + Date.now() };
    setAccounts(prev => [...prev, newAcc]);
    saveAccountApi(newAcc);
    addToast('Account Connected', `${newAcc.name} added`, 'success');
  };

  const updateAccount = (acc: TradingAccount) => {
    setAccounts(prev => prev.map(a => a.id === acc.id ? acc : a));
    saveAccountApi(acc);
    addToast('Account Saved', acc.name, 'success');
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    deleteAccountApi(id);
    if (selectedAccountId === id) setSelectedAccountId('all');
    addToast('Account Removed', 'Account deleted', 'warning');
  };

  // Playbooks CRUD
  const addPlaybook = (pb: Omit<Playbook, 'id'>) => {
    const newPb: Playbook = { ...pb, id: 'pb-' + Date.now() };
    setPlaybooks(prev => [...prev, newPb]);
    savePlaybookApi(newPb);
    addToast('Playbook Created', `Playbook "${newPb.name}" ready`, 'success');
  };

  const updatePlaybook = (pb: Playbook) => {
    setPlaybooks(prev => prev.map(p => p.id === pb.id ? pb : p));
    savePlaybookApi(pb);
    addToast('Playbook Saved', pb.name, 'success');
  };

  const deletePlaybook = (id: string) => {
    setPlaybooks(prev => prev.filter(p => p.id !== id));
    deletePlaybookApi(id);
    addToast('Playbook Deleted', '', 'info');
  };

  const duplicatePlaybook = (id: string) => {
    const source = playbooks.find(p => p.id === id);
    if (!source) return;
    const duplicated: Playbook = {
      ...source,
      id: 'pb-' + Date.now(),
      name: `${source.name} (Copy)`,
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      profitFactor: 0,
      avgWinner: 0,
      avgLoser: 0,
      expectancy: 0,
      createdAt: new Date().toISOString(),
    };
    setPlaybooks(prev => [...prev, duplicated]);
    savePlaybookApi(duplicated);
    addToast('Playbook Duplicated', `Created "${duplicated.name}"`, 'success');
  };

  const archivePlaybook = (id: string, newStatus: 'Active' | 'Paused' | 'Archived' = 'Archived') => {
    setPlaybooks(prev => prev.map(p => {
      if (p.id === id) {
        const updated: Playbook = { ...p, status: newStatus as any };
        savePlaybookApi(updated);
        return updated;
      }
      return p;
    }));
    addToast('Status Updated', `Playbook status set to ${newStatus}`, 'info');
  };

  // Strategy CRUD
  const addStrategy = (strat: Omit<Strategy, 'id'>) => {
    const newStrat: Strategy = { ...strat, id: 'strat-' + Date.now() };
    setStrategies(prev => [...prev, newStrat]);
    saveStrategyApi(newStrat);
    addToast('Strategy Created', newStrat.name, 'success');
  };

  // Notes CRUD
  const addNote = (noteData: Omit<JournalNote, 'id'>): JournalNote => {
    const newNote: JournalNote = { ...noteData, id: 'note-' + Date.now() };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    saveNoteApi(newNote);
    addToast('Note Created', newNote.title, 'success');
    return newNote;
  };

  const updateNote = (note: JournalNote) => {
    setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    if (selectedNote?.id === note.id) setSelectedNote(note);
    saveNoteApi(note);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    deleteNoteApi(id);
    if (selectedNote?.id === id) {
      setSelectedNote(notes.find(n => n.id !== id) || null);
    }
    addToast('Note Deleted', '', 'info');
  };

  const addFolder = (name: string, icon = 'Folder') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newFolder: JournalFolder = {
      id: 'f-' + Date.now(),
      name: trimmed,
      icon,
      count: 0,
    };
    setFolders(prev => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    saveFolderApi(newFolder);
    addToast('Folder Created', `Folder "${trimmed}" ready`, 'success');
  };

  const updateFolder = (id: string, name: string, icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const folder = folders.find(f => f.id === id);
    const updated = { ...(folder || { id, name: trimmed, icon: icon || 'Folder', count: 0 }), name: trimmed, icon: icon || folder?.icon };
    setFolders(prev => prev.map(f => f.id === id ? updated : f));
    saveFolderApi(updated);
    addToast('Folder Saved', trimmed, 'success');
  };

  const deleteFolder = (id: string) => {
    if (['f-all', 'f-trade', 'f-daily', 'f-sessions', 'f-goals', 'f-plan', 'f-templates'].includes(id)) {
      addToast('System Folder', 'Default system folders cannot be deleted', 'warning');
      return;
    }
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: 'f-daily' } : n));
    setFolders(prev => prev.filter(f => f.id !== id));
    deleteFolderApi(id);
    if (selectedFolderId === id) setSelectedFolderId('f-all');
    addToast('Folder Removed', 'Notes moved to Daily Journal', 'info');
  };

  // Goals
  const updateRiskGoals = (goals: Partial<RiskGoalSettings>) => {
    const updated = { ...riskGoals, ...goals };
    setRiskGoals(updated);
    saveRiskGoalsApi(updated);
    addToast('Risk Rules Updated', 'New targets and limit parameters saved', 'success');
  };

  // Calendar
  const toggleEventFavorite = (id: string) => {
    setCalendarEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isFavorite: !ev.isFavorite } : ev));
  };

  const toggleEventReminder = (id: string) => {
    setCalendarEvents(prev => prev.map(ev => ev.id === id ? { ...ev, hasReminder: !ev.hasReminder } : ev));
    addToast('Reminder Toggled', 'Notification set for economic release', 'info');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    addToast('Cleared', 'All notifications cleared', 'info');
  };

  // Lounge
  const toggleLikePost = async (id: string) => {
    // Optimistic UI update
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const hasLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked,
            likes: hasLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
    try {
      const res = await toggleLikePostApi(id);
      if (res && typeof res.likesCount === 'number') {
        setCommunityPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, likes: res.likesCount, hasLiked: res.liked } : p))
        );
      }
    } catch (error: any) {
      addToast('Error', error.message || 'Failed to toggle like', 'error');
      const freshPosts = await fetchCommunityPostsApi();
      if (freshPosts.length > 0) setCommunityPosts(freshPosts);
    }
  };

  const addCommunityPost = async (content: string, symbol?: string, pnl?: string, rMultiple?: string, imageUrl?: string) => {
    try {
      const saved = await saveCommunityPostApi({
        content,
        symbol,
        pnl,
        rMultiple,
        imageUrl,
      });
      if (saved) {
        setCommunityPosts((prev) => {
          if (prev.some((p) => p.id === saved.id)) return prev;
          return [saved, ...prev];
        });
        addToast('Post Published', 'Trade idea shared in Lounge', 'success');
      }
    } catch (error: any) {
      addToast('Post Failed', error.message || 'Could not publish post', 'error');
    }
  };

  const deleteCommunityPost = async (id: string) => {
    try {
      await deleteCommunityPostApi(id);
      setCommunityPosts((prev) => prev.filter((p) => p.id !== id));
      addToast('Post Deleted', 'Your post has been removed', 'info');
    } catch (error: any) {
      addToast('Action Failed', error.message || 'Could not delete post', 'error');
    }
  };

  const addPostComment = async (postId: string, content: string) => {
    try {
      const res = await addPostCommentApi(postId, content);
      if (res && res.comment) {
        setCommunityPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              const existing = p.comments || [];
              const commentExists = existing.some((c) => c.id === res.comment.id);
              const newComments = commentExists ? existing : [...existing, res.comment];
              return {
                ...p,
                commentsCount: Math.max(res.commentsCount, newComments.length),
                comments: newComments,
              };
            }
            return p;
          })
        );
      }
    } catch (error: any) {
      addToast('Comment Failed', error.message || 'Could not post comment', 'error');
    }
  };

  const deletePostComment = async (postId: string, commentId: string) => {
    try {
      const res = await deletePostCommentApi(postId, commentId);
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const newComments = (p.comments || []).filter((c) => c.id !== commentId);
            return {
              ...p,
              commentsCount: Math.max(res.commentsCount, newComments.length),
              comments: newComments,
            };
          }
          return p;
        })
      );
      addToast('Comment Removed', 'Comment deleted', 'info');
    } catch (error: any) {
      addToast('Action Failed', error.message || 'Could not delete comment', 'error');
    }
  };

  // Formatters
  const formatCurrency = (val: number, customMode?: CurrencyDisplayMode) => {
    const mode = customMode || currencyMode;
    if (mode === 'PRIVACY') {
      return '••••••';
    }
    if (mode === 'PERCENT') {
      const base = 50000;
      const pct = (val / base) * 100;
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    }
    if (mode === 'R_MULTIPLE') {
      const riskPerR = 400;
      const r = val / riskPerR;
      return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
    }
    if (mode === 'TICKS') {
      const ticks = Math.round(val / 12.5);
      return `${ticks >= 0 ? '+' : ''}${ticks} ticks`;
    }
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(val));

    return val < 0 ? `-${formatted}` : formatted;
  };

  const formatRMultiple = (r: number) => {
    return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
  };

  const resetToSampleData = () => {
    setTrades(INITIAL_TRADES);
    setAccounts(INITIAL_ACCOUNTS);
    setPlaybooks(INITIAL_PLAYBOOKS);
    setNotes(INITIAL_NOTES);
    setRiskGoals(INITIAL_RISK_GOALS);
    addToast('Data Reset', 'Restored pristine sample trading records', 'info');
  };

  const clearAllTradesData = () => {
    setTrades([]);
    addToast('Cleared All Trades', 'Trade history wiped clean', 'warning');
  };

  const refreshState = async () => {
    try {
      const data = await fetchInitialState();
      if (data && data.success) {
        if (Array.isArray(data.accounts)) setAccounts(data.accounts);
        if (Array.isArray(data.connections)) setConnections(data.connections);
        if (Array.isArray(data.trades)) setTrades(data.trades);
        if (Array.isArray(data.playbooks)) setPlaybooks(data.playbooks);
        if (Array.isArray(data.strategies)) setStrategies(data.strategies);
      }
    } catch (e) {
      console.warn('refreshState failed:', e);
    }
  };

  return (
    <TradingContext.Provider
      value={{
        activeView,
        setActiveView,
        currencyMode,
        setCurrencyMode,
        theme,
        setTheme,
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        addAccount,
        updateAccount,
        deleteAccount,
        connections,
        setConnections,
        refreshState,
        propFirmAccounts,
        selectedPropFirmAccountId,
        setSelectedPropFirmAccountId,
        addPropFirmAccount,
        updatePropFirmAccount,
        deletePropFirmAccount,
        addPropFirmViolation,
        recordPropFirmPayout,
        trades,
        filteredTrades,
        addTrade,
        updateTrade,
        deleteTrade,
        duplicateTrade,
        bulkDeleteTrades,
        bulkEditTrades,
        importTrades,
        undoLastDelete,
        canUndo: deletedTradesStack.length > 0,
        selectedTrade,
        setSelectedTrade,
        isAddTradeOpen,
        setIsAddTradeOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        dateRange,
        setDateRange,
        playbooks: computedPlaybooks,
        addPlaybook,
        updatePlaybook,
        deletePlaybook,
        duplicatePlaybook,
        archivePlaybook,
        strategies: computedStrategies,
        addStrategy,
        notes,
        folders,
        selectedNote,
        setSelectedNote,
        selectedFolderId,
        setSelectedFolderId,
        addNote,
        updateNote,
        deleteNote,
        addFolder,
        updateFolder,
        deleteFolder,
        riskGoals,
        updateRiskGoals,
        calendarEvents,
        toggleEventFavorite,
        toggleEventReminder,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        userProfile,
        updateUserProfile,
        regenerateAccountCode,
        mentorStudents,
        mentorRequests,
        activeStudentImpersonation,
        setActiveStudentImpersonation,
        connectStudentByCode,
        approveMentorRequest,
        declineMentorRequest,
        disconnectStudent,
        mentorDirectivesSent,
        mentorDirectivesReceived,
        dispatchMentorDirective,
        acknowledgeMentorDirective,
        communityPosts,
        currentUserId,
        toggleLikePost,
        addCommunityPost,
        deleteCommunityPost,
        addPostComment,
        deletePostComment,
        leaderboard,
        fetchLeaderboard,
        updateUserPointsAdmin,
        updateUserRoleAdmin,
        // Self Improvement System
        habits,
        habitCompletions,
        tasks,
        checkins,
        morningCheckin,
        nightlyReview,
        routines,
        routineCompletions,
        sleepLogs,
        exerciseLogs,
        learningLogs,
        deepWorkSessions,
        distractionLogs,
        disciplineStreak,
        goals,
        rules,
        achievements,
        userGrowthLevel,
        selectedImprovementDate,
        setSelectedImprovementDate,
        currentGrowthScore,
        toggleHabit,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleTask,
        addTask,
        updateTask,
        deleteTask,
        saveDailyCheckin,
        saveMorningCheckin,
        saveNightlyReview,
        toggleRoutineItem,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        logSleep,
        logExercise,
        logLearning,
        logDeepWorkSession,
        logDistraction,
        updateDisciplineStreak,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalMilestone,
        addRule,
        toggleRuleVerification,
        deleteRule,

        toasts,
        addToast,
        removeToast,
        formatCurrency,
        formatRMultiple,
        resetToSampleData,
        clearAllTradesData,
        authUser,
        isAuthenticated,
        setIsAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        logout,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
