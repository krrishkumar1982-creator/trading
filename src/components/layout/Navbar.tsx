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
    <header className={`sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 transition-colors lg:px-6 select-none ${
      isLight 
        ? 'border-[#E5E7EB] bg-white text-[#111827]' 
        : 'border-[#26262B] bg-[#09090B] text-[#F4F4F5]'
    }`}>
      {/* Zone 1: Impersonation Alert & Live Market Clock */}
      <div className="flex items-center gap-3">
        {/* Impersonation Banner if Mentor Reviewing Student */}
        {activeStudentImpersonation && (
          <div className="flex items-center gap-2 bg-[rgba(245,184,46,0.12)] border border-[rgba(245,184,46,0.30)] text-[#F5B82E] px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Viewing as: <strong>{activeStudentImpersonation.name}</strong></span>
            <button
              onClick={() => setActiveStudentImpersonation(null)}
              className="ml-1 text-[11px] bg-[rgba(245,184,46,0.20)] hover:bg-[rgba(245,184,46,0.30)] text-[#F5B82E] px-2 py-0.5 rounded transition"
            >
              Exit
            </button>
          </div>
        )}

        {/* Live Market Status & Clock */}
        <div className={`flex items-center gap-2.5 text-xs px-3 py-1.5 rounded-lg border ${
          isLight ? 'bg-[#F8FAFC] border-[#E5E7EB] text-[#4B5563]' : 'bg-[#121215] border-[#26262B] text-[#A1A1AA]'
        }`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D6A3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D6A3]"></span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#00D6A3]">
            MARKET LIVE
          </span>
          <span className={isLight ? 'text-[#D1D5DB]' : 'text-[#26262B]'}>|</span>
          <span className={`font-mono text-[11px] ${isLight ? 'text-[#111827] font-medium' : 'text-[#F4F4F5]'}`}>
            {currentTime || 'Syncing...'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Controls & Selectors */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Global Search / Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className={`hidden lg:flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-xs transition ${
            isLight
              ? 'border-[#E5E7EB] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4B5563] hover:text-[#111827]'
              : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:border-[#36363D] hover:text-[#F4F4F5]'
          }`}
        >
          <Search className={`h-3.5 w-3.5 ${isLight ? 'text-[#6B7280]' : 'text-[#71717A]'}`} />
          <span className="font-medium">Quick Search...</span>
          <kbd className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold border ${
            isLight
              ? 'bg-white text-[#4B5563] border-[#E5E7EB]'
              : 'bg-[#18181C] text-[#A1A1AA] border-[#26262B]'
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
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
                : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:border-[#36363D] hover:text-[#F4F4F5]'
            }`}
            title="Display Units Mode"
          >
            {currencyMode === 'USD' && <DollarSign className="w-3.5 h-3.5 text-[#00D6A3]" />}
            {currencyMode === 'PERCENT' && <Percent className="w-3.5 h-3.5 text-[#2563FF]" />}
            {currencyMode === 'PRIVACY' && <EyeOff className="w-3.5 h-3.5 text-[#F5B82E]" />}
            {currencyMode === 'R_MULTIPLE' && <span className="font-bold text-xs text-[#2563FF]">R</span>}
            {currencyMode === 'TICKS' && <Hash className="w-3.5 h-3.5 text-[#00D6A3]" />}
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isCurrencyDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-52 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
              isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#121215] border-[#26262B] text-[#F4F4F5]'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#71717A] border-[#26262B]'
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
                      ? 'hover:bg-[#F8FAFC] text-[#111827]'
                      : 'hover:bg-[rgba(37,99,255,0.08)] hover:text-[#F4F4F5] text-[#A1A1AA]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <opt.icon className={`w-3.5 h-3.5 ${currencyMode === opt.id ? 'text-[#2563FF]' : 'text-[#71717A]'}`} />
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  {currencyMode === opt.id && <Check className="w-3.5 h-3.5 text-[#2563FF]" />}
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
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
                : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:border-[#36363D] hover:text-[#F4F4F5]'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${isLight ? 'text-[#2563FF]' : 'text-[#4C7DFF]'}`} />
            <span>Filters</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isFilterDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-52 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs ${
              isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#121215] border-[#26262B] text-[#F4F4F5]'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#71717A] border-[#26262B]'
              }`}>
                Filter by Status
              </div>
              <div className="py-1 space-y-1">
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${
                    isLight ? 'hover:bg-[#F8FAFC] text-[#111827]' : 'hover:bg-[#18181C] text-[#A1A1AA]'
                  }`}
                >
                  All Trades
                </button>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    isLight ? 'hover:bg-[#ECFDF5] text-[#059669] font-medium' : 'hover:bg-[#18181C] text-[#00D6A3]'
                  }`}
                >
                  Winning Trades
                </button>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                    isLight ? 'hover:bg-[#FEF2F2] text-[#DC2626] font-medium' : 'hover:bg-[#18181C] text-[#FF3D6E]'
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
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
                : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:border-[#36363D] hover:text-[#F4F4F5]'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-[#2563FF]' : 'text-[#4C7DFF]'}`} />
            <span className="max-w-[130px] truncate">
              {dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate} - ${dateRange.endDate}`
                : dateRange.presetLabel || 'Date range'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
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
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#111827]'
                : 'border-[#26262B] bg-[#121215] text-[#F4F4F5] hover:border-[#36363D]'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#00D6A3]"></div>
            <span className="max-w-[110px] truncate">
              {selectedAccountId === 'all' ? 'All Accounts' : currentAccount?.name || 'Account'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          {isAccountDropdownOpen && (
            <div className={`absolute right-0 mt-2 w-60 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 ${
              isLight ? 'bg-white border-[#E5E7EB] text-[#111827]' : 'bg-[#121215] border-[#26262B] text-[#F4F4F5]'
            }`}>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b ${
                isLight ? 'text-[#6B7280] border-[#E5E7EB]' : 'text-[#71717A] border-[#26262B]'
              }`}>
                Active Trading Portfolio
              </div>
              <button
                onClick={() => {
                  setSelectedAccountId('all');
                  setIsAccountDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                  isLight ? 'hover:bg-[#F8FAFC] text-[#111827]' : 'hover:bg-[rgba(37,99,255,0.08)] hover:text-[#F4F4F5] text-[#A1A1AA]'
                }`}
              >
                <span className="font-semibold">All Accounts Combined</span>
                {selectedAccountId === 'all' && <Check className="w-3.5 h-3.5 text-[#2563FF]" />}
              </button>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                    isLight ? 'hover:bg-[#F8FAFC] text-[#111827]' : 'hover:bg-[rgba(37,99,255,0.08)] hover:text-[#F4F4F5] text-[#A1A1AA]'
                  }`}
                >
                  <div>
                    <div className={`font-semibold ${isLight ? 'text-[#111827]' : 'text-[#F4F4F5]'}`}>{acc.name}</div>
                    <div className={`text-[10px] flex items-center gap-1.5 ${isLight ? 'text-[#6B7280]' : 'text-[#A1A1AA]'}`}>
                      <span className={`px-1 rounded ${isLight ? 'bg-[#F1F5F9] border border-[#E5E7EB]' : 'bg-[#18181C]'}`}>{acc.broker}</span>
                      <span className="font-mono">${(acc?.currentBalance ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                  {selectedAccountId === acc.id && <Check className="w-3.5 h-3.5 text-[#2563FF]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Dark / Light) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`rounded-lg border p-2 transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
              : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:text-[#F4F4F5] hover:border-[#36363D]'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-[#4C7DFF]" />
          ) : (
            <Sun className="w-4 h-4 text-[#F5B82E]" />
          )}
        </button>

        {/* User Auth Profile / Sign In Button */}
        {authUser ? (
          <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white text-[#111827]'
              : 'border-[#26262B] bg-[#121215] text-[#F4F4F5]'
          }`}>
            <div className="w-5 h-5 rounded-full bg-[rgba(37,99,255,0.15)] text-[#2563FF] font-bold flex items-center justify-center text-[10px] uppercase border border-[rgba(37,99,255,0.30)]">
              {(authUser.displayName || authUser.email || 'U')[0]}
            </div>
            <span className="hidden md:inline font-semibold max-w-[100px] truncate">
              {authUser.displayName || authUser.email?.split('@')[0]}
            </span>
            <button
              onClick={() => logout()}
              className="p-1 text-[#A1A1AA] hover:text-[#FF3D6E] transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              isLight
                ? 'border-[rgba(37,99,255,0.20)] bg-[rgba(37,99,255,0.08)] hover:bg-[rgba(37,99,255,0.15)] text-[#1D4ED8]'
                : 'border-[rgba(37,99,255,0.25)] bg-[rgba(37,99,255,0.10)] hover:bg-[rgba(37,99,255,0.18)] text-[#4C7DFF]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className={`relative rounded-lg border p-2 transition ${
            isLight
              ? 'border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] text-[#4B5563]'
              : 'border-[#26262B] bg-[#121215] text-[#A1A1AA] hover:text-[#F4F4F5] hover:border-[#36363D]'
          }`}
          title="Notifications & Risk Alerts"
        >
          <Bell className={`w-4 h-4 ${isLight ? 'text-[#4B5563]' : 'text-[#A1A1AA]'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563FF] text-[9px] font-bold text-white shadow-sm ring-2 ring-[#09090B]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Quick Add Trade CTA Button */}
        <button
          onClick={() => setIsAddTradeOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[#2563FF] hover:bg-[#2F6BFF] text-white px-3.5 py-1.5 text-xs font-semibold transition active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Trade</span>
        </button>
      </div>
    </header>
  );
};
