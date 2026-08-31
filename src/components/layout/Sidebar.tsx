import React, { useState, useEffect } from 'react';
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
  Globe,
  Newspaper,
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
  LogOut,
} from 'lucide-react';
import { useTrading, ActiveView } from '../../context/TradingContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { activeView, setActiveView, theme, userProfile, authUser, logout } = useTrading();
  const isLight = theme === 'light';
  const [imageError, setImageError] = useState(false);

  const avatarUrl =
    userProfile?.avatarUrl ||
    userProfile?.avatar ||
    authUser?.user_metadata?.avatar_url ||
    authUser?.user_metadata?.picture ||
    '';

  const accountName =
    userProfile?.name?.trim() ||
    authUser?.user_metadata?.full_name?.trim() ||
    authUser?.user_metadata?.name?.trim() ||
    (authUser as any)?.displayName?.trim() ||
    (authUser?.email ? authUser.email.split('@')[0] : '') ||
    'Trader';

  const userInitials = accountName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'TR';

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

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
    { id: 'self-improvement', label: 'Self Improvement', icon: Flame, badge: 'NEW' },
    { id: 'goals', label: 'Progress Goals', icon: Target },
    { id: 'news', label: 'Market Intelligence', icon: Globe },
    { id: 'mentor-mode', label: 'Mentor Hub', icon: Users2 },
    { id: 'ai-coach', label: 'AI Review Coach', icon: Bot, badge: 'AI' },
    { id: 'tools', label: 'Calculators & Sizing', icon: Calculator },
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
      className={`relative flex flex-col h-screen border-r transition-all duration-200 z-30 select-none overflow-hidden shrink-0 ${
        isLight
          ? 'bg-white border-[#E5E7EB] text-[#111827]'
          : 'bg-[#0E0E11] border-[#26262B] text-[#F4F4F5]'
      } ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-4 border-b gap-3 ${isLight ? 'border-[#E5E7EB]' : 'border-[#26262B] bg-transparent'}`}>
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563FF] text-white font-bold text-xs tracking-wider">
          TF
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00D6A3] ring-2 ring-[#0E0E11]" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-[14px] font-bold tracking-tight truncate ${isLight ? 'text-[#111827]' : 'text-[#F4F4F5]'}`}>
                TradeForge
              </span>
              <span className="text-[9px] font-semibold tracking-wider px-1.5 py-0.2 rounded bg-[rgba(37,99,255,0.12)] text-[#2563FF] border border-[rgba(37,99,255,0.25)]">
                PRO
              </span>
            </div>
            <span className={`text-[11px] font-medium tracking-wide truncate ${isLight ? 'text-[#6B7280]' : 'text-[#A1A1AA]'}`}>
              Institutional Terminal
            </span>
          </div>
        )}
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 custom-scrollbar">
        {/* Core Nav */}
        <div>
          {!isCollapsed && (
            <div className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#9CA3AF]' : 'text-[#71717A]'}`}>
              Platform
            </div>
          )}
          <nav className="space-y-0.5">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8] border border-[rgba(37,99,255,0.20)] font-semibold'
                        : 'bg-[rgba(37,99,255,0.08)] text-[#F4F4F5] border border-[rgba(37,99,255,0.18)] font-semibold'
                      : isLight
                        ? 'text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#111827] border border-transparent'
                        : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.035)] hover:text-[#F4F4F5] border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Small blue left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-[2px] bg-[#2563FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? isLight ? 'text-[#2563FF]' : 'text-[#4C7DFF]'
                        : isLight ? 'text-[#6B7280] group-hover:text-[#111827]' : 'text-[#71717A] group-hover:text-[#D4D4D8]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                      item.badge === 'PRO'
                        ? 'bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border border-[rgba(37,99,255,0.25)]'
                        : 'bg-[rgba(0,214,163,0.10)] text-[#00D6A3] border border-[rgba(0,214,163,0.30)]'
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
            <div className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#9CA3AF]' : 'text-[#71717A]'}`}>
              Execution & Intelligence
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
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8] border border-[rgba(37,99,255,0.20)] font-semibold'
                        : 'bg-[rgba(37,99,255,0.08)] text-[#F4F4F5] border border-[rgba(37,99,255,0.18)] font-semibold'
                      : isLight
                        ? 'text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#111827] border border-transparent'
                        : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.035)] hover:text-[#F4F4F5] border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Small blue left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-[2px] bg-[#2563FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? isLight ? 'text-[#2563FF]' : 'text-[#4C7DFF]'
                        : isLight ? 'text-[#6B7280] group-hover:text-[#111827]' : 'text-[#71717A] group-hover:text-[#D4D4D8]'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border border-[rgba(37,99,255,0.25)]">
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
            <div className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#9CA3AF]' : 'text-[#71717A]'}`}>
              Config
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
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-[rgba(37,99,255,0.08)] text-[#1D4ED8] border border-[rgba(37,99,255,0.20)] font-semibold'
                        : 'bg-[rgba(37,99,255,0.08)] text-[#F4F4F5] border border-[rgba(37,99,255,0.18)] font-semibold'
                      : isLight
                        ? 'text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#111827] border border-transparent'
                        : 'text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.035)] hover:text-[#F4F4F5] border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Small blue left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-[2px] bg-[#2563FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
                      isActive
                        ? isLight ? 'text-[#2563FF]' : 'text-[#4C7DFF]'
                        : isLight ? 'text-[#6B7280] group-hover:text-[#111827]' : 'text-[#71717A] group-hover:text-[#D4D4D8]'
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
      <div className={`p-2.5 border-t flex items-center justify-between ${isLight ? 'border-[#E5E7EB] bg-[#F8FAFC]' : 'border-[#26262B] bg-[#0E0E11]'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                {avatarUrl && !imageError ? (
                  <img
                    src={avatarUrl}
                    alt={accountName}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#2563FF]/30 shadow-sm"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-lg font-semibold text-xs flex items-center justify-center ${
                    isLight ? 'bg-[rgba(37,99,255,0.10)] text-[#1D4ED8] border border-[rgba(37,99,255,0.20)]' : 'bg-[rgba(37,99,255,0.12)] text-[#4C7DFF] border border-[rgba(37,99,255,0.25)]'
                  }`}>
                    {userInitials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00D6A3] ring-2 ring-[#0E0E11]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-semibold truncate ${isLight ? 'text-[#111827]' : 'text-[#F4F4F5]'}`} title={accountName}>
                  {accountName}
                </span>
                <span className={`text-[10px] font-mono truncate ${isLight ? 'text-[#6B7280]' : 'text-[#A1A1AA]'}`}>
                  {authUser?.email || userProfile?.email || userProfile?.accountCode || 'Active Session'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => logout()}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight
                    ? 'text-[#6B7280] hover:text-[#DC2626] hover:bg-[#FEE2E2]'
                    : 'text-[#A1A1AA] hover:text-[#FF3D6E] hover:bg-[rgba(255,61,110,0.1)]'
                }`}
                title="Sign Out / Switch Account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]' : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.05)]'}`}
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className={`w-full flex justify-center p-1.5 rounded-lg transition-colors ${isLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB]' : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.05)]'}`}
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

