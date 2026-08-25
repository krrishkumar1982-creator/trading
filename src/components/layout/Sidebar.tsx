import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ListOrdered,
  BookmarkCheck,
  BarChart3,
  TrendingUp,
  History,
  Users2,
  Target,
  CalendarDays,
  Bot,
  Calculator,
  MessageSquare,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useTrading, ActiveView } from '../../context/TradingContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { activeView, setActiveView, theme } = useTrading();
  const isLight = theme === 'light';

  const mainNavItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notebook', label: 'Daily Journal', icon: BookOpen },
    { id: 'trades', label: 'Trades', icon: ListOrdered },
    { id: 'playbook', label: 'Playbooks', icon: BookmarkCheck, badge: 'NEW' },
    { id: 'reports', label: 'Reports', icon: BarChart3, badge: 'NEW' },
    { id: 'advanced-analytics', label: 'Deep Analytics', icon: TrendingUp },
  ];

  const tradingToolsNav: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'backtesting', label: 'Trade Replay', icon: History },
    { id: 'goals', label: 'Progress Tracker', icon: Target },
    { id: 'calendar', label: 'Economic Calendar', icon: CalendarDays },
    { id: 'mentor-mode', label: 'Mentor Hub', icon: Users2 },
    { id: 'ai-coach', label: 'AI Coach', icon: Bot, badge: 'AI' },
    { id: 'tools', label: 'Calculators', icon: Calculator },
    { id: 'lounge', label: 'Resource Center', icon: MessageSquare },
  ];

  const bottomNav: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'integrations', label: 'Broker Sync', icon: Link2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Guides', icon: HelpCircle },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r transition-all duration-200 z-20 select-none ${
        isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-950 border-slate-800/90 text-slate-100'
      } ${
        isCollapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Top Brand: Logo & Website Name */}
      <div className={`h-16 flex items-center px-3.5 border-b gap-2.5 ${isLight ? 'border-zinc-200' : 'border-slate-800/80'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white font-black text-sm tracking-wider">
          DF
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className={`text-sm font-bold tracking-tight flex items-center gap-1.5 truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              DuskFlow
              <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                isLight ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
              }`}>
                PRO
              </span>
            </span>
            <span className={`text-[10px] truncate ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>Trading Journal</span>
          </div>
        )}
      </div>

      {/* Navigation Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3.5 custom-scrollbar">
        {/* Core Nav */}
        <div>
          <nav className="space-y-0.5">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50/90 text-blue-900 font-bold border border-blue-300 shadow-xs pl-3'
                        : 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm pl-3'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-100 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${
                      isLight ? 'bg-blue-600' : 'bg-blue-400'
                    }`} />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-600 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tools Section */}
        <div>
          {!isCollapsed && (
            <div className={`px-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              Tools & Tracking
            </div>
          )}
          <nav className="space-y-0.5">
            {tradingToolsNav.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50/90 text-blue-900 font-bold border border-blue-300 shadow-xs pl-3'
                        : 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm pl-3'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-100 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${
                      isLight ? 'bg-blue-600' : 'bg-blue-400'
                    }`} />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className={`ml-auto text-[8.5px] font-bold uppercase px-1.5 py-0.2 rounded ${
                      isLight
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Platform Section */}
        <div>
          {!isCollapsed && (
            <div className={`px-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              System
            </div>
          )}
          <nav className="space-y-0.5">
            {bottomNav.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50/90 text-blue-900 font-bold border border-blue-300 shadow-xs pl-3'
                        : 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/40 shadow-sm pl-3'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-100 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${
                      isLight ? 'bg-blue-600' : 'bg-blue-400'
                    }`} />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Collapse Toggle */}
      <div className={`p-2 border-t flex items-center justify-between ${isLight ? 'border-zinc-200 bg-white' : 'border-slate-800/80 bg-slate-950'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center ${
                isLight ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              }`}>
                AR
              </div>
              <span className={`text-xs font-medium truncate ${isLight ? 'text-zinc-700' : 'text-slate-300'}`}>Alex River</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className={`p-1 rounded transition ${isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className={`w-full flex justify-center p-1 rounded transition ${isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
