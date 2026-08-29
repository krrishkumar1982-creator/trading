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
} from '../types';
import { calculatePlaybookMetrics } from '../lib/metrics';
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
  updateUserRoleAdminApi
} from '../services/apiClient';
import { io } from 'socket.io-client';
import { auth, onAuthStateChanged, signOutUser, User } from '../lib/firebase';

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
  | 'ai-coach'
  | 'tools'
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

  // Prop Firm Accounts & Rule Engine
  propFirmAccounts: PropFirmAccount[];
  selectedPropFirmAccountId: string;
  setSelectedPropFirmAccountId: (id: string) => void;
  addPropFirmAccount: (account: Omit<PropFirmAccount, 'id' | 'createdAt'>) => void;
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
  
  // Community Lounge
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
    if (path.includes('/coach') || hash.includes('coach')) return 'ai-coach';
    if (path.includes('/tools') || hash.includes('tools')) return 'tools';
    if (path.includes('/lounge') || hash.includes('lounge')) return 'lounge';
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

  const [accounts, setAccounts] = useState<TradingAccount[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  
  // Prop Firm Accounts state with LocalStorage persistence
  const [propFirmAccounts, setPropFirmAccounts] = useState<PropFirmAccount[]>(() => {
    try {
      const saved = localStorage.getItem('tf_prop_firm_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROP_FIRM_ACCOUNTS;
  });
  const [selectedPropFirmAccountId, setSelectedPropFirmAccountId] = useState<string>(
    INITIAL_PROP_FIRM_ACCOUNTS[0]?.id || 'pf-ftmo-100k'
  );

  useEffect(() => {
    try {
      localStorage.setItem('tf_prop_firm_accounts', JSON.stringify(propFirmAccounts));
    } catch {
      // ignore
    }
  }, [propFirmAccounts]);

  const addPropFirmAccount = (newAcc: Omit<PropFirmAccount, 'id' | 'createdAt'>) => {
    const created: PropFirmAccount = {
      ...newAcc,
      id: `pf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setPropFirmAccounts((prev) => [created, ...prev]);
    setSelectedPropFirmAccountId(created.id);
  };

  const updatePropFirmAccount = (updated: PropFirmAccount) => {
    setPropFirmAccounts((prev) =>
      prev.map((acc) => (acc.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : acc))
    );
  };

  const deletePropFirmAccount = (id: string) => {
    setPropFirmAccounts((prev) => {
      const next = prev.filter((acc) => acc.id !== id);
      if (selectedPropFirmAccountId === id && next.length > 0) {
        setSelectedPropFirmAccountId(next[0].id);
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
    setPropFirmAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? { ...acc, violations: [newViol, ...acc.violations], riskState: newViol.severity === 'BREACH' ? 'BREACHED' : 'CRITICAL' }
          : acc
      )
    );
  };

  const recordPropFirmPayout = (
    accountId: string,
    payout: Omit<PropFirmPayoutRecord, 'id'>
  ) => {
    const record: PropFirmPayoutRecord = {
      ...payout,
      id: `pay-${Date.now()}`,
    };
    setPropFirmAccounts((prev) =>
      prev.map((acc) => {
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
      })
    );
  };
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const [deletedTradesStack, setDeletedTradesStack] = useState<Trade[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>(INITIAL_PLAYBOOKS);
  const [strategies, setStrategies] = useState<Strategy[]>(INITIAL_STRATEGIES);
  const [notes, setNotes] = useState<JournalNote[]>(INITIAL_NOTES);
  const [folders, setFolders] = useState<JournalFolder[]>(INITIAL_FOLDERS);
  const [selectedNote, setSelectedNote] = useState<JournalNote | null>(INITIAL_NOTES[0] || null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('f-all');
  const [riskGoals, setRiskGoals] = useState<RiskGoalSettings>(INITIAL_RISK_GOALS);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-me',
    name: 'Alex River',
    email: 'alex.river@duskflow.trade',
    accountCode: 'TFB-7XK9-MP42',
    experienceLevel: 'Full-Time Prop & Futures Trader (4+ Years)',
  });

  const [mentorStudents, setMentorStudents] = useState<MentorStudent[]>(INITIAL_MENTOR_STUDENTS);
  const [mentorDirectivesSent, setMentorDirectivesSent] = useState<any[]>([]);
  const [mentorDirectivesReceived, setMentorDirectivesReceived] = useState<any[]>([]);
  const [mentorRequests, setMentorRequests] = useState<MentorConnectionRequest[]>([
    {
      id: 'req-1',
      studentCode: 'TFB-7XK9-MP42',
      studentName: 'Alex River (You)',
      studentEmail: 'alex.river@duskflow.trade',
      mentorName: 'Pro Mentor Sarah Connor',
      status: 'PENDING',
      createdAt: '1 hour ago',
    }
  ]);

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
  const [apiAuthToken, setApiAuthTokenState] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const currentUserId = authUser?.uid || 'default_user_1';
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
    setApiAuthToken(null);
    setApiAuthTokenState(null);
    setAuthUser(null);
    setAccounts([]);
    setTrades([]);
    setPlaybooks([]);
    setStrategies([]);
    setNotes([]);
    setFolders([]);
    setSelectedNote(null);
    setMentorStudents([]);
    setMentorDirectivesSent([]);
    setMentorDirectivesReceived([]);
    await signOutUser();
    addToast('Signed Out', 'You have been signed out', 'info');
  };

  // Listen to Firebase Auth state changes and load user-isolated data
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      // Reset state for clean user switching / logout
      setAccounts([]);
      setTrades([]);
      setPlaybooks([]);
      setStrategies([]);
      setNotes([]);
      setFolders([]);
      setSelectedNote(null);
      setMentorStudents([]);
      setMentorDirectivesSent([]);
      setMentorDirectivesReceived([]);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setApiAuthToken(token);
          setApiAuthTokenState(token);
          setAuthUser(firebaseUser);
          setUserProfile((prev) => ({
            ...prev,
            name: firebaseUser.displayName || prev.name || 'Trader',
            email: firebaseUser.email || prev.email || '',
          }));
        } catch (err) {
          console.error('Failed to get user ID token:', err);
        }
      } else {
        setApiAuthToken(null);
        setApiAuthTokenState(null);
        setAuthUser(null);
      }

      const data = await fetchInitialState();
      if (!isMounted || !data || !data.success) return;

      if (Array.isArray(data.accounts)) setAccounts(data.accounts);
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
    });

    return () => {
      isMounted = false;
      unsubscribe();
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

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    addToast('Profile Updated', 'User profile settings saved', 'success');
  };

  const regenerateAccountCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TFB-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    setUserProfile(prev => ({ ...prev, accountCode: code }));
    addToast('New Code Generated', `Your new mentor code is ${code}`, 'success');
    return code;
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
        toasts,
        addToast,
        removeToast,
        formatCurrency,
        formatRMultiple,
        resetToSampleData,
        clearAllTradesData,
        authUser,
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
