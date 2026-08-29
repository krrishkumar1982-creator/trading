import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  Shield,
  TrendingUp,
  Calculator,
  Calendar,
  Settings,
  Bot,
  Users2,
  ListOrdered,
  FileSpreadsheet,
  Zap,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useTrading, ActiveView } from '../../context/TradingContext';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveView,
    setIsAddTradeOpen,
    trades,
    playbooks,
    setSelectedTrade,
    resetToSampleData,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const quickActions = [
    {
      id: 'add-trade',
      label: 'Log New Trade',
      desc: 'Open trade manual entry modal',
      icon: Plus,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsAddTradeOpen(true);
      },
    },
    {
      id: 'nav-dashboard',
      label: 'Open Dashboard',
      desc: 'View balance, P&L calendar, and radar score',
      icon: TrendingUp,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('dashboard');
      },
    },
    {
      id: 'nav-performance',
      label: 'Performance Analytics',
      desc: 'View Net P&L, win rate, equity curve, drawdown, and periodic reports',
      icon: TrendingUp,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('reports');
      },
    },
    {
      id: 'nav-advanced-analytics',
      label: 'Advanced Analytics & Diagnostics',
      desc: 'Uncover patterns across symbols, setups, time heatmaps, and psychology',
      icon: Zap,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('advanced-analytics');
      },
    },
    {
      id: 'nav-journal',
      label: 'Open Daily Journal',
      desc: 'Review pre-market plan and post-market notes',
      icon: BookOpen,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('notebook');
      },
    },
    {
      id: 'nav-prop-firm',
      label: 'Prop Firm Compliance Hub',
      desc: 'Monitor drawdown, profit targets, daily loss limits & pre-trade risk',
      icon: Shield,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('prop-firm');
      },
    },
    {
      id: 'nav-ai',
      label: 'Ask AI Trading Coach',
      desc: 'Analyze mistakes, FOMO, and get actionable review',
      icon: Bot,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('ai-coach');
      },
    },
    {
      id: 'nav-calc',
      label: 'Position Size & Risk Calculator',
      desc: 'Calculate precise contracts/lots per stop loss',
      icon: Calculator,
      action: () => {
        setIsCommandPaletteOpen(false);
        setActiveView('tools');
      },
    },
    {
      id: 'reset-data',
      label: 'Reset to Realistic Sample Data',
      desc: 'Restore fresh sample portfolio with 40+ trades',
      icon: RotateCcw,
      action: () => {
        setIsCommandPaletteOpen(false);
        resetToSampleData();
      },
    },
  ];

  const filteredActions = quickActions.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.desc.toLowerCase().includes(query.toLowerCase())
  );

  const matchedTrades = trades.filter(t =>
    t.symbol.toLowerCase().includes(query.toLowerCase()) ||
    t.setupType.toLowerCase().includes(query.toLowerCase()) ||
    t.notes.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const matchedPlaybooks = playbooks.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-20 px-4 animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className={`flex items-center gap-3 border-b px-4 py-3.5 ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
          <Search className={`w-5 h-5 shrink-0 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, symbol (MES, EURUSD), setup, or shortcut..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm focus:outline-none ${
              isLight ? 'text-zinc-900 placeholder:text-zinc-400' : 'text-slate-100 placeholder-slate-500'
            }`}
          />
          <kbd className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
            isLight ? 'bg-zinc-100 text-zinc-500 border-zinc-200' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* Quick Actions */}
          <div>
            <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-400'}`}>
              Quick Actions
            </div>
            <div className="space-y-1">
              {filteredActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition group ${
                      isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      isLight ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>{action.label}</div>
                      <div className={`text-[11px] truncate ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>{action.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matched Trades */}
          {query.trim().length > 0 && matchedTrades.length > 0 && (
            <div>
              <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-400'}`}>
                Matching Trades
              </div>
              <div className="space-y-1">
                {matchedTrades.map(trade => (
                  <button
                    key={trade.id}
                    onClick={() => {
                      setSelectedTrade(trade);
                      setIsCommandPaletteOpen(false);
                      setActiveView('trades');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                      isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        trade.direction === 'BUY'
                          ? isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-400'
                          : isLight ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {trade.direction}
                      </span>
                      <span className={`font-semibold text-xs ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>{trade.symbol}</span>
                      <span className={`text-[11px] truncate max-w-[200px] ${isLight ? 'text-zinc-500' : 'text-slate-400'}`}>{trade.setupType}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-semibold ${
                        trade.netPnl >= 0
                          ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                          : isLight ? 'text-rose-600' : 'text-rose-400'
                      }`}>
                        {trade.netPnl >= 0 ? '+' : ''}${trade.netPnl.toFixed(2)}
                      </span>
                      <span className={`text-[10px] ml-2 ${isLight ? 'text-zinc-400' : 'text-slate-400'}`}>({trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R)</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Playbooks */}
          {query.trim().length > 0 && matchedPlaybooks.length > 0 && (
            <div>
              <div className={`px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-400' : 'text-slate-400'}`}>
                Matching Playbooks
              </div>
              <div className="space-y-1">
                {matchedPlaybooks.map(pb => (
                  <button
                    key={pb.id}
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setActiveView('playbook');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                      isLight ? 'hover:bg-zinc-100 text-zinc-800' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{pb.icon}</span>
                      <span className={`text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>{pb.name}</span>
                    </div>
                    <span className={`text-xs font-mono font-medium ${isLight ? 'text-blue-600' : 'text-indigo-400'}`}>{pb.winRate}% WR</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className={`border-t px-4 py-2 text-[11px] flex items-center justify-between ${
          isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-slate-800 bg-slate-950/60 text-slate-400'
        }`}>
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> navigate</span>
            <span><strong>↵</strong> select</span>
            <span><strong>esc</strong> close</span>
          </div>
          <span className={`font-medium ${isLight ? 'text-blue-600' : 'text-indigo-400'}`}>DuskFlow Global Command</span>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => setIsCommandPaletteOpen(false)} />
    </div>
  );
};
