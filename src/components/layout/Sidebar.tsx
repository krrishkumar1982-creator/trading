import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ListOrdered,
  BookmarkCheck,
  BarChart3,
  TrendingUp,
  Shield,
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
  HelpCircle,
  Activity,
  Flame,
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
    { id: 'prop-firm', label: 'Prop Firm Hub', icon: Shield, badge: 'PRO' },
    { id: 'notebook', label: 'Daily Journal', icon: BookOpen },
    { id: 'trades', label: 'Trades Log', icon: ListOrdered },
    { id: 'playbook', label: 'Playbooks', icon: BookmarkCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'advanced-analytics', label: 'Deep Analytics', icon: TrendingUp },
  ];

  const tradingToolsNav: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'goals', label: 'Progress Goals', icon: Target },
    { id: 'calendar', label: 'Economic Calendar', icon: CalendarDays },
    { id: 'mentor-mode', label: 'Mentor Hub', icon: Users2 },
    { id: 'ai-coach', label: 'AI Review Coach', icon: Bot, badge: 'AI' },
    { id: 'tools', label: 'Calculators & Sizing', icon: Calculator },
    { id: 'lounge', label: 'Trader Lounge', icon: MessageSquare },
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
      className={`relative flex flex-col border-r transition-all duration-300 z-30 select-none ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-900'
          : 'bg-[#0B0E14] border-[#1E2536] text-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.4)]'
      } ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-4 border-b gap-3 ${isLight ? 'border-zinc-200' : 'border-[#1E2536]'}`}>
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/25 text-white font-black text-sm tracking-wider ring-1 ring-white/20">
          TF
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0E14]" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[15px] font-extrabold tracking-tight truncate ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                TradeForge
              </span>
              <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <span className={`text-[11px] font-medium tracking-wide truncate ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
              Institutional Analytics
            </span>
          </div>
        )}
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {/* Core Nav */}
        <div>
          {!isCollapsed && (
            <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              Platform
            </div>
          )}
          <nav className="space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                        : 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-[#151B28] hover:text-slate-200 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.badge === 'PRO'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
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
            <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              Execution & Intelligence
            </div>
          )}
          <nav className="space-y-1">
            {tradingToolsNav.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                        : 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-[#151B28] hover:text-slate-200 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Section */}
        <div>
          {!isCollapsed && (
            <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              Config
            </div>
          )}
          <nav className="space-y-1">
            {bottomNav.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? isLight
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                        : 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                        : 'text-slate-400 hover:bg-[#151B28] hover:text-slate-200 border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? isLight ? 'text-blue-600' : 'text-blue-400'
                        : isLight ? 'text-zinc-400 group-hover:text-zinc-700' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Collapse Toggle & User Badge */}
      <div className={`p-2.5 border-t flex items-center justify-between ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-[#1E2536] bg-[#0B0E14]'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center ${
                  isLight ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                }`}>
                  AR
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0B0E14]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold truncate ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>
                  Alex River
                </span>
                <span className={`text-[10px] font-mono truncate ${isLight ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Funded Master
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className={`p-1.5 rounded-lg transition ${isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-slate-400 hover:text-white hover:bg-[#161B26]'}`}
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className={`w-full flex justify-center p-1.5 rounded-lg transition ${isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200' : 'text-slate-400 hover:text-white hover:bg-[#161B26]'}`}
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

