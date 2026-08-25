import React, { useState } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ToastContainer } from './components/layout/ToastContainer';

import { DashboardView } from './components/dashboard/DashboardView';
import { TradesListView } from './components/trades/TradesListView';
import { DailyJournalNotebook } from './components/journal/DailyJournalNotebook';
import { PlaybookView } from './components/playbook/PlaybookView';
import { PerformanceAnalyticsView } from './components/analytics/PerformanceAnalyticsView';
import { PerformanceReportsView } from './components/reports/PerformanceReportsView';
import { AdvancedAnalyticsView } from './components/analytics/AdvancedAnalyticsView';
import { BacktestingReplayView } from './components/backtesting/BacktestingReplayView';
import { MentorModeView } from './components/mentor/MentorModeView';
import { GoalsRiskView } from './components/goals/GoalsRiskView';
import { EconomicCalendarView } from './components/calendar/EconomicCalendarView';
import { AiTradingCoachView } from './components/ai/AiTradingCoachView';
import { TradingToolsView } from './components/tools/TradingToolsView';
import { TradersLoungeView } from './components/lounge/TradersLoungeView';
import { SettingsSyncView } from './components/settings/SettingsSyncView';

import { AddEditTradeModal } from './components/trades/AddEditTradeModal';
import { TradeDetailDrawer } from './components/trades/TradeDetailDrawer';
import { ImportTradesModal } from './components/trades/ImportTradesModal';
import { AuthModal } from './components/auth/AuthModal';
import { Trade } from './types';
import { BookOpen, Sparkles, ExternalLink } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    theme,
    activeView,
    selectedTrade,
    setSelectedTrade,
    isAddTradeOpen,
    setIsAddTradeOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useTrading();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  const handleOpenEdit = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsAddTradeOpen(true);
  };

  return (
    <div
      className={`relative flex h-screen w-screen overflow-hidden font-sans ${
        theme === 'light'
          ? 'bg-[#F8FAFC] text-[#111827]'
          : 'bg-[#09090B] text-[#F5F5F5]'
      }`}
    >
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <Navbar
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenFilters={() => {}}
          onOpenDateRange={() => {}}
        />

        {/* Scrollable View Area */}
        <main
          className={`flex-1 overflow-y-auto custom-scrollbar ${
            theme === 'light' ? 'bg-[#F8FAFC]' : 'bg-[#09090B]'
          }`}
        >
          {activeView === 'dashboard' && (
            <DashboardView
              onSelectTrade={t => setSelectedTrade(t)}
              onOpenImport={() => setIsImportOpen(true)}
            />
          )}

          {activeView === 'trades' && (
            <TradesListView
              onOpenAddTrade={() => {
                setTradeToEdit(null);
                setIsAddTradeOpen(true);
              }}
              onOpenImport={() => setIsImportOpen(true)}
            />
          )}

          {(activeView === 'notebook' || activeView === 'journal') && (
            <DailyJournalNotebook />
          )}

          {activeView === 'playbook' && <PlaybookView />}

          {activeView === 'reports' && <PerformanceReportsView />}

          {activeView === 'advanced-analytics' && <AdvancedAnalyticsView />}

          {activeView === 'backtesting' && <BacktestingReplayView />}

          {activeView === 'mentor-mode' && <MentorModeView />}

          {activeView === 'goals' && <GoalsRiskView />}

          {activeView === 'calendar' && <EconomicCalendarView />}

          {activeView === 'ai-coach' && <AiTradingCoachView />}

          {activeView === 'tools' && <TradingToolsView />}

          {activeView === 'lounge' && <TradersLoungeView />}

          {(activeView === 'integrations' || activeView === 'settings') && (
            <SettingsSyncView onOpenImport={() => setIsImportOpen(true)} />
          )}

          {activeView === 'help' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div className={`flex items-center gap-3 pb-3 border-b ${
                theme === 'light' ? 'border-zinc-200' : 'border-slate-800'
              }`}>
                <BookOpen className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600' : 'text-indigo-400'}`} />
                <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  DuskFlow Platform Guide & Master Trader Manual
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-blue-600' : 'text-indigo-400'}`}>
                    1. Daily Journaling Workflow
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-slate-300'}`}>
                    Start each session in the Daily Journal with the pre-market checklist. Mark HTF levels and define max risk before clicking order submission.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    2. Playbook Compliance & Edge
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-slate-300'}`}>
                    Categorize each execution into an A+ setup. DuskFlow computes your win rate and expectancy per setup so you double down on what works.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-rose-600' : 'text-rose-400'}`}>
                    3. Circuit Breaker & Safety
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-slate-300'}`}>
                    Hard daily loss caps automatically trigger emergency locks to prevent revenge trading spirals.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-purple-600' : 'text-violet-400'}`}>
                    4. Gemini AI Coaching Engine
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-slate-300'}`}>
                    Get institutional-grade trade critique, psychological leak diagnosis, and actionable tactical next steps.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals, Drawers & Overlays */}
      <AddEditTradeModal
        isOpen={isAddTradeOpen}
        onClose={() => {
          setIsAddTradeOpen(false);
          setTradeToEdit(null);
        }}
        tradeToEdit={tradeToEdit}
      />

      <TradeDetailDrawer
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
        onOpenEdit={handleOpenEdit}
      />

      <ImportTradesModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <TradingProvider>
      <MainLayout />
    </TradingProvider>
  );
}

export default App;
