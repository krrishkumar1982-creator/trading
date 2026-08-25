import React, { useState } from 'react';
import {
  X,
  Plus,
  Save,
  FolderOpen,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  SavedBacktestSession,
  TimeframeId,
  DemoAccount,
  BacktestSessionSettings,
  IntrabarAmbiguityRule,
} from './types';
import { INSTRUMENTS, TIMEFRAMES } from './instruments';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  currentTimeframe: TimeframeId;
  currentStartDate: string;
  currentAccount: DemoAccount;
  currentTradesCount: number;
  currentSettings?: BacktestSessionSettings;
  onStartNewSession: (config: {
    symbol: string;
    timeframe: TimeframeId;
    startDate: string;
    startingBalance: number;
    leverage: number;
    currency: 'USD' | 'EUR' | 'GBP';
    settings: BacktestSessionSettings;
  }) => void;
  onSaveSession: (name: string, notes?: string) => void;
  savedSessions: SavedBacktestSession[];
  onLoadSession: (session: SavedBacktestSession) => void;
  onDeleteSession: (sessionId: string) => void;
  formatCurrency: (val: number) => string;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  currentTimeframe,
  currentStartDate,
  currentAccount,
  currentTradesCount,
  currentSettings,
  onStartNewSession,
  onSaveSession,
  savedSessions,
  onLoadSession,
  onDeleteSession,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'SAVE' | 'LOAD'>('NEW');

  // New session state
  const [newSymbol, setNewSymbol] = useState<string>(currentSymbol);
  const [newTimeframe, setNewTimeframe] = useState<TimeframeId>(currentTimeframe);
  const [newStartDate, setNewStartDate] = useState<string>(currentStartDate || '2024-06-10');
  const [newBalance, setNewBalance] = useState<number>(currentAccount.startingBalance || 10000);
  const [newLeverage, setNewLeverage] = useState<number>(currentAccount.leverage || 100);
  const [newCurrency, setNewCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');

  // Execution Realism & Rules
  const [spreadPips, setSpreadPips] = useState<number>(currentSettings?.spreadPips || 1.2);
  const [commissionPerLot, setCommissionPerLot] = useState<number>(currentSettings?.commissionPerLot || 3.5);
  const [slippagePips, setSlippagePips] = useState<number>(currentSettings?.slippagePips || 0.2);
  const [riskPercent, setRiskPercent] = useState<number>(currentSettings?.riskPercent || 1.0);
  const [defaultLotSize, setDefaultLotSize] = useState<number>(currentSettings?.defaultLotSize || 0.1);
  const [intrabarRule, setIntrabarRule] = useState<IntrabarAmbiguityRule>(
    currentSettings?.intrabarAmbiguityRule || 'CONSERVATIVE'
  );
  const [tradingSession, setTradingSession] = useState<'ALL' | 'LONDON' | 'NEW_YORK' | 'ASIAN' | 'SYDNEY'>('ALL');
  const [timezone, setTimezone] = useState<string>(currentSettings?.timezone || 'UTC');

  // Save session state
  const [saveName, setSaveName] = useState<string>(
    `${currentSymbol} ${currentTimeframe} Replay (${new Date().toLocaleDateString()})`
  );
  const [saveNotes, setSaveNotes] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Session Manager</h2>
              <p className="text-xs text-slate-400">Configure, save, and load historical replay sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-xs border-b-2 transition ${
              activeTab === 'NEW'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Replay Session</span>
          </button>
          <button
            onClick={() => setActiveTab('SAVE')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-xs border-b-2 transition ${
              activeTab === 'SAVE'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Current Session</span>
          </button>
          <button
            onClick={() => setActiveTab('LOAD')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-xs border-b-2 transition ${
              activeTab === 'LOAD'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Saved Sessions ({savedSessions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* TAB 1: NEW SESSION */}
          {activeTab === 'NEW' && (
            <div className="space-y-4">
              {/* Instrument Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Instrument / Market</label>
                <select
                  value={newSymbol}
                  onChange={e => setNewSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  {INSTRUMENTS.map(inst => (
                    <option key={inst.symbol} value={inst.symbol}>
                      {inst.symbol} - {inst.name} ({inst.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe & Historical Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Timeframe</label>
                  <select
                    value={newTimeframe}
                    onChange={e => setNewTimeframe(e.target.value as TimeframeId)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf.id} value={tf.id}>
                        {tf.label} ({tf.seconds / 60 >= 60 ? `${tf.seconds / 3600} Hour` : `${tf.seconds / 60} Min`})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Historical Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={e => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Starting Balance & Currency */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Virtual Demo Balance</span>
                  <div className="flex items-center gap-1 font-mono text-indigo-400">
                    {newCurrency} {newBalance.toLocaleString()}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-2">
                  {[1000, 5000, 10000, 25000, 50000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewBalance(amt)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                        newBalance === amt
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ${(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>

                {/* Custom Balance Input */}
                <input
                  type="number"
                  min={500}
                  max={1000000}
                  step={500}
                  value={newBalance}
                  onChange={e => setNewBalance(parseFloat(e.target.value) || 10000)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Custom starting balance ($)"
                />
              </div>

              {/* Leverage & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Account Leverage</label>
                  <select
                    value={newLeverage}
                    onChange={e => setNewLeverage(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value={10}>1:10 (Conservative)</option>
                    <option value={30}>1:30 (EU Standard)</option>
                    <option value={50}>1:50 (US Standard)</option>
                    <option value={100}>1:100 (Pro Demo)</option>
                    <option value={500}>1:500 (High Leverage)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Base Currency</label>
                  <select
                    value={newCurrency}
                    onChange={e => setNewCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Professional Execution Realism Section */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Realistic Trading Costs & Execution Rules</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Phase 6 Engine</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Spread (Pips)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={spreadPips}
                      onChange={e => setSpreadPips(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Comm ($/lot)</label>
                    <input
                      type="number"
                      step={0.5}
                      min={0}
                      value={commissionPerLot}
                      onChange={e => setCommissionPerLot(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">Slippage (Pips)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={slippagePips}
                      onChange={e => setSlippagePips(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Intrabar SL/TP Ambiguity Rule</span>
                    <span className="text-[9px] text-slate-500">When both touched in 1 bar</span>
                  </label>
                  <select
                    value={intrabarRule}
                    onChange={e => setIntrabarRule(e.target.value as IntrabarAmbiguityRule)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CONSERVATIVE">Conservative (Assume Stop Loss first)</option>
                    <option value="OPTIMISTIC">Optimistic (Assume Take Profit first)</option>
                    <option value="OHLC_PATH">OHLC Path Simulation (Simulate open-high-low-close path)</option>
                    <option value="RANDOM">Monte Carlo 50/50 Probabilistic</option>
                  </select>
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={() => {
                  onStartNewSession({
                    symbol: newSymbol,
                    timeframe: newTimeframe,
                    startDate: newStartDate,
                    startingBalance: newBalance,
                    leverage: newLeverage,
                    currency: newCurrency,
                    settings: {
                      startingBalance: newBalance,
                      currency: newCurrency,
                      leverage: newLeverage,
                      riskPercent,
                      defaultLotSize,
                      spreadPips,
                      commissionPerLot,
                      slippagePips,
                      intrabarAmbiguityRule: intrabarRule,
                      tradingSession,
                      timezone,
                    },
                  });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Initialize Replay Session</span>
              </button>
            </div>
          )}

          {/* TAB 2: SAVE CURRENT SESSION */}
          {activeTab === 'SAVE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Session:</span>
                  <span className="font-bold text-white">
                    {currentSymbol} • {currentTimeframe}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Balance / Equity:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(currentAccount.equity)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Trades Executed:</span>
                  <span className="text-slate-200">{currentTradesCount} trades</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Session Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Session Notes & Observations</label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={e => setSaveNotes(e.target.value)}
                  placeholder="Write execution notes, market structure observations, strategy rules tested..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => {
                  onSaveSession(saveName, saveNotes);
                  setActiveTab('LOAD');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Replay State</span>
              </button>
            </div>
          )}

          {/* TAB 3: LOAD SAVED SESSIONS */}
          {activeTab === 'LOAD' && (
            <div className="space-y-3">
              {savedSessions.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <FolderOpen className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">No Saved Sessions Found</p>
                  <p className="text-[11px] text-slate-500">
                    Save your current replay session to continue your practice anytime.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedSessions.map(sess => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white truncate">{sess.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px]">
                            {sess.symbol} {sess.timeframe}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                          <span>
                            Equity:{' '}
                            <strong className={sess.account.equity >= sess.account.startingBalance ? 'text-emerald-400' : 'text-rose-400'}>
                              {formatCurrency(sess.account.equity)}
                            </strong>
                          </span>
                          <span>Trades: {sess.trades?.length || 0}</span>
                          <span>{new Date(sess.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {sess.notes && (
                          <p className="text-[11px] text-slate-500 truncate">{sess.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onLoadSession(sess);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => onDeleteSession(sess.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
