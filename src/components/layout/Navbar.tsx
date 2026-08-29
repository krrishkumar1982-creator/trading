import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Plus,
  Calendar,
  Filter,
  DollarSign,
  Percent,
  EyeOff,
  Hash,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { CurrencyDisplayMode } from '../../types';
import { DateRangeDropdown, DateRangeState } from './DateRangeDropdown';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenFilters?: () => void;
  onOpenDateRange?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenFilters,
}) => {
  const {
    currencyMode,
    setCurrencyMode,
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    setIsAddTradeOpen,
    setIsCommandPaletteOpen,
    notifications,
    activeStudentImpersonation,
    setActiveStudentImpersonation,
    theme,
    setTheme,
    dateRange,
    setDateRange,
    authUser,
    setIsAuthModalOpen,
    logout,
  } = useTrading();

  const isLight = theme === 'light';

  const [currentTime, setCurrentTime] = useState('');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const currencyRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      };
      setCurrentTime(`${now.toLocaleDateString('en-US', options)} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const currentAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <header className={`sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 transition-all lg:px-6 ${
      isLight 
        ? 'border-zinc-200 bg-white/90 backdrop-blur-xl shadow-xs' 
        : 'border-[#1E2536] bg-[#0B0E14]/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
    }`}>
      {/* Zone 1: Impersonation Alert & Live Market Clock */}
      <div className="flex items-center gap-3">
        {/* Impersonation Banner if Mentor Reviewing Student */}
        {activeStudentImpersonation && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Viewing as: <strong>{activeStudentImpersonation.name}</strong></span>
            <button
              onClick={() => setActiveStudentImpersonation(null)}
              className="ml-1 text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded transition"
            >
              Exit
            </button>
          </div>
        )}

        {/* Live Market Status & Clock */}
        <div className={`flex items-center gap-2.5 text-xs px-3 py-1.5 rounded-xl border ${
          isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-[#121622] border-[#1E2536] text-slate-300'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
            MARKET LIVE
          </span>
          <span className={isLight ? 'text-zinc-300' : 'text-slate-700'}>|</span>
          <span className={`font-mono text-[11px] ${isLight ? 'text-zinc-800 font-medium' : 'text-slate-200'}`}>
            {currentTime || 'Syncing...'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Controls & Selectors */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Global Search / Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className={`hidden lg:flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs transition ${
            isLight
              ? 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 shadow-xs'
              : 'border-[#1E2536] bg-[#121622] text-slate-400 hover:border-[#2A344B] hover:text-slate-200 shadow-xs'
          }`}
        >
          <Search className={`h-3.5 w-3.5 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`} />
          <span className="font-medium">Quick Search...</span>
          <kbd className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold border ${
            isLight
              ? 'bg-white text-zinc-600 border-zinc-200'
              : 'bg-[#1A2130] text-slate-400 border-[#2A344B]'
          }`}>
            ⌘K
          </kbd>
        </button>

        {/* 1. Currency Display Mode Dropdown */}
        <div className="relative" ref={currencyRef}>
          <button
            onClick={() => {
              setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
              setIsAccountDropdownOpen(false);
              setIsDateRangeOpen(false);
              setIsFilterDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-[#1E2536] bg-[#121622] text-slate-300 hover:border-[#2A344B] hover:bg-[#161B26]'
            }`}
            title="Display Units Mode"
          >
            {currencyMode === 'USD' && <DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
            {currencyMode === 'PERCENT' && <Percent className="w-3.5 h-3.5 text-blue-400" />}
            {currencyMode === 'PRIVACY' && <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
            {currencyMode === 'R_MULTIPLE' && <span className="font-bold text-xs text-blue-400">R</span>}
            {currencyMode === 'TICKS' && <Hash className="w-3.5 h-3.5 text-cyan-400" />}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isCurrencyDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-52 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
              isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#0F131D] border-[#1E2536] text-slate-100'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-zinc-500 border-zinc-100' : 'text-slate-400 border-[#1E2536]'
              }`}>
                Display Metrics In
              </div>
              {[
                { id: 'USD', label: 'Dollar ($)', desc: 'Realized currency', icon: DollarSign },
                { id: 'PERCENT', label: 'Percentage (%)', desc: 'Account growth', icon: Percent },
                { id: 'R_MULTIPLE', label: 'R-Multiple (R)', desc: 'Risk unit', icon: Sparkles },
                { id: 'TICKS', label: 'Ticks / Points', desc: 'Price steps', icon: Hash },
                { id: 'PRIVACY', label: 'Privacy Mode (••••)', desc: 'Hide amounts', icon: EyeOff },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setCurrencyMode(opt.id as CurrencyDisplayMode);
                    setIsCurrencyDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                    isLight
                      ? 'hover:bg-zinc-100 text-zinc-800'
                      : 'hover:bg-blue-600/15 hover:text-blue-300 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <opt.icon className={`w-3.5 h-3.5 ${currencyMode === opt.id ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  {currencyMode === opt.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Quick Filters Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => {
              setIsFilterDropdownOpen(!isFilterDropdownOpen);
              setIsCurrencyDropdownOpen(false);
              setIsAccountDropdownOpen(false);
              setIsDateRangeOpen(false);
            }}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-[#1E2536] bg-[#121622] text-slate-300 hover:border-[#2A344B] hover:bg-[#161B26]'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            <span>Filters</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isFilterDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-52 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs ${
              isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#0F131D] border-[#1E2536] text-slate-200'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-zinc-500 border-zinc-100' : 'text-slate-400 border-[#1E2536]'
              }`}>
                Filter by Status
              </div>
              <div className="py-1 space-y-1">
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-[#161B26] text-slate-300'
                  }`}
                >
                  All Trades
                </button>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    isLight ? 'hover:bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-[#161B26] text-emerald-400'
                  }`}
                >
                  Winning Trades
                </button>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    isLight ? 'hover:bg-rose-50 text-rose-700 font-medium' : 'hover:bg-[#161B26] text-rose-400'
                  }`}
                >
                  Losing Trades
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Date Range Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsDateRangeOpen(!isDateRangeOpen);
              setIsCurrencyDropdownOpen(false);
              setIsAccountDropdownOpen(false);
              setIsFilterDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-xs'
                : 'border-[#1E2536] bg-[#121622] text-slate-300 hover:border-[#2A344B] hover:bg-[#161B26]'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
            <span className="max-w-[130px] truncate">
              {dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate} - ${dateRange.endDate}`
                : dateRange.presetLabel || 'Date range'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <DateRangeDropdown
            isOpen={isDateRangeOpen}
            onClose={() => setIsDateRangeOpen(false)}
            selectedRange={dateRange}
            onSelectRange={(newRange: DateRangeState) => {
              setDateRange(newRange);
            }}
          />
        </div>

        {/* 4. Account Selector Dropdown */}
        <div className="relative" ref={accountRef}>
          <button
            onClick={() => {
              setIsAccountDropdownOpen(!isAccountDropdownOpen);
              setIsCurrencyDropdownOpen(false);
              setIsDateRangeOpen(false);
              setIsFilterDropdownOpen(false);
            }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 shadow-xs'
                : 'border-[#1E2536] bg-[#121622] text-slate-200 hover:border-[#2A344B] hover:bg-[#161B26]'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]"></div>
            <span className="max-w-[110px] truncate">
              {selectedAccountId === 'all' ? 'All Accounts' : currentAccount?.name || 'Account'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isAccountDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-60 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
              isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-[#0F131D] border-[#1E2536] text-slate-100'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-zinc-500 border-zinc-100' : 'text-slate-400 border-[#1E2536]'
              }`}>
                Active Trading Portfolio
              </div>
              <button
                onClick={() => {
                  setSelectedAccountId('all');
                  setIsAccountDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                  isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-blue-600/15 hover:text-blue-300 text-slate-200'
                }`}
              >
                <span className="font-semibold">All Accounts Combined</span>
                {selectedAccountId === 'all' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                    isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-blue-600/15 hover:text-blue-300 text-slate-200'
                  }`}
                >
                  <div>
                    <div className={`font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-200'}`}>{acc.name}</div>
                    <div className={`text-[10px] flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>
                      <span className={`px-1 rounded ${isLight ? 'bg-zinc-100 border border-zinc-200' : 'bg-[#1A2130]'}`}>{acc.broker}</span>
                      <span className="font-mono">${(acc?.currentBalance ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {selectedAccountId === acc.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Dark / Light) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`rounded-xl border p-2 transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
              : 'border-[#1E2536] bg-[#121622] text-slate-300 hover:text-white hover:border-[#2A344B]'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* User Auth Profile / Sign In Button */}
        {authUser ? (
          <div className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition ${
            isLight
              ? 'border-zinc-200 bg-white text-zinc-800 shadow-xs'
              : 'border-[#1E2536] bg-[#121622] text-slate-200'
          }`}>
            <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px] uppercase border border-blue-500/30">
              {(authUser.displayName || authUser.email || 'U')[0]}
            </div>
            <span className="hidden md:inline font-semibold max-w-[100px] truncate">
              {authUser.displayName || authUser.email?.split('@')[0]}
            </span>
            <button
              onClick={() => logout()}
              className="p-1 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700'
                : 'border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className={`relative rounded-xl border p-2 transition ${
            isLight
              ? 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
              : 'border-[#1E2536] bg-[#121622] text-slate-300 hover:text-white hover:border-[#2A344B]'
          }`}
          title="Notifications & Risk Alerts"
        >
          <Bell className={`w-4 h-4 ${isLight ? 'text-zinc-700' : 'text-slate-300'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[#0B0E14]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Quick Add Trade CTA Button */}
        <button
          onClick={() => setIsAddTradeOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white px-4 py-2 text-xs font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Trade</span>
        </button>
      </div>
    </header>
  );
};
