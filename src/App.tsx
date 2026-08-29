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
import { PropFirmView } from './components/propfirm/PropFirmView';
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
          ? 'bg-[#F4F6F9] text-zinc-900'
          : 'bg-[#0A0D14] text-slate-100'
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
            theme === 'light' ? 'bg-[#F4F6F9]' : 'bg-[#0A0D14]'
          }`}
        >
          {activeView === 'dashboard' && (
            <DashboardView
              onSelectTrade={t => setSelectedTrade(t)}
              onOpenImport={() => setIsImportOpen(true)}
            />
          )}

          {activeView === 'prop-firm' && (
            <PropFirmView />
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
                theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'
              }`}>
                <BookOpen className={`w-6 h-6 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
                <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  TradeForge Institutional Platform Guide
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#0E1118] border-zinc-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                    1. Daily Journaling & Execution Protocol
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Start each session in the Daily Journal with the pre-market checklist. Mark HTF levels and define max risk before clicking order submission.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#0E1118] border-zinc-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    2. Prop Firm Rule Compliance & Edge
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Track multi-account evaluation limits, trailing drawdowns (EOD & Intraday HWM), daily loss buffers, and profit targets with real-time pre-trade simulations.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#0E1118] border-zinc-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-rose-600' : 'text-rose-400'}`}>
                    3. Circuit Breaker & Safety Locks
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Hard daily loss caps automatically trigger emergency locks to prevent revenge trading spirals and account breaches.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border space-y-2 ${
                  theme === 'light' ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#0E1118] border-zinc-800'
                }`}>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-purple-600' : 'text-violet-400'}`}>
                    4. TradeForge AI Intelligence
                  </h3>
                  <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
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
