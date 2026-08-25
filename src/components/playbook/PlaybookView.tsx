import React, { useState } from 'react';
import {
  Plus,
  BookmarkCheck,
  CheckCircle2,
  Lock,
  Globe,
  SlidersHorizontal,
  TrendingUp,
  Award,
  MoreVertical,
  X,
  CheckSquare,
  Square,
  Sparkles,
  Trash2,
  Edit2
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Playbook, PlaybookRule } from '../../types';

export const PlaybookView: React.FC = () => {
  const {
    playbooks,
    addPlaybook,
    updatePlaybook,
    deletePlaybook,
    formatCurrency,
    addToast
  } = useTrading();

  const [sortBy, setSortBy] = useState<'pnl' | 'winrate' | 'trades' | 'name'>('pnl');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeChecklistPlaybook, setActiveChecklistPlaybook] = useState<Playbook | null>(null);
  const [checkedRules, setCheckedRules] = useState<{ [ruleId: string]: boolean }>({});

  // Form State for new playbook
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState('#8b5cf6');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<PlaybookRule[]>([
    { id: 'r-1', text: 'Clean higher timeframe structure tap / sweep', category: 'MARKET', required: true },
    { id: 'r-2', text: '5-minute market structure shift with volume delta', category: 'ENTRY', required: true },
    { id: 'r-3', text: 'Stop Loss strictly placed beyond invalidation wick', category: 'RISK', required: true },
    { id: 'r-4', text: 'Take Profit at opposing liquidity pool (minimum 2.0R)', category: 'EXIT', required: true },
  ]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<'ENTRY' | 'EXIT' | 'RISK' | 'MARKET'>('ENTRY');

  // Sorting
  const sortedPlaybooks = [...playbooks].sort((a, b) => {
    if (sortBy === 'pnl') return b.netPnl - a.netPnl;
    if (sortBy === 'winrate') return b.winRate - a.winRate;
    if (sortBy === 'trades') return b.totalTrades - a.totalTrades;
    return a.name.localeCompare(b.name);
  });

  const handleCreatePlaybook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Name Required', 'Please enter a playbook setup name', 'error');
      return;
    }

    addPlaybook({
      name,
      icon,
      color,
      description: description || 'Predefined trading rules setup for consistent edge.',
      status: 'A_PLUS',
      rules,
      exampleScreenshots: ['https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80'],
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      profitFactor: 0,
      avgWinner: 0,
      avgLoser: 0,
      expectancy: 0,
      missedTradesCount: 0,
      isPrivate: true,
    });

    setIsCreateModalOpen(false);
    setName('');
    setDescription('');
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setRules(prev => [
      ...prev,
      {
        id: 'r-' + Date.now(),
        text: newRuleText.trim(),
        category: newRuleCategory,
        required: true,
      },
    ]);
    setNewRuleText('');
  };

  const handleRemoveRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const openRuleChecker = (pb: Playbook) => {
    setActiveChecklistPlaybook(pb);
    const initialChecked: { [k: string]: boolean } = {};
    pb.rules.forEach((r, idx) => {
      initialChecked[r.id] = idx === 0; // check first rule by default
    });
    setCheckedRules(initialChecked);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header matching Screenshot 7 */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-blue-400" />
            Trading Playbooks & A+ Setups
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define precise entry, exit, and risk rules to measure playbook edge and discipline
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="pnl" className="bg-slate-900">Net P&L</option>
              <option value="winrate" className="bg-slate-900">Win Rate</option>
              <option value="trades" className="bg-slate-900">Total Trades</option>
              <option value="name" className="bg-slate-900">Name A-Z</option>
            </select>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-blue-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playbook</span>
          </button>
        </div>
      </div>

      {/* Playbook Cards Grid (matching Screenshot 4 & 7) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedPlaybooks.map(pb => {
          const isProfitable = pb.netPnl >= 0;
          return (
            <div
              key={pb.id}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/95 p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/40 transition group relative overflow-hidden"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      style={{ backgroundColor: `${pb.color}25`, borderColor: `${pb.color}50` }}
                      className="text-2xl p-2.5 rounded-2xl border flex items-center justify-center"
                    >
                      {pb.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition">
                        {pb.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          {pb.totalTrades} {pb.totalTrades === 1 ? 'trade' : 'trades'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          {pb.isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {pb.isPrivate ? 'Private' : 'Shared'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openRuleChecker(pb)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-lg transition"
                  >
                    Check Rules
                  </button>
                </div>

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {pb.description}
                </p>

                {/* Primary Metrics Row (matching Screenshot 7) */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/80">
                  {/* Win Rate */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-emerald-400 border-r-emerald-400 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-mono font-bold text-slate-300">{Math.round(pb.winRate)}%</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Win rate</div>
                      <div className="text-xs font-bold text-slate-200">{pb.winRate}%</div>
                    </div>
                  </div>

                  {/* Net P&L */}
                  <div>
                    <div className="text-[10px] text-slate-500">Net P&L</div>
                    <div className={`text-xs font-mono font-extrabold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(pb.netPnl)}
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-950/70 p-2.5 rounded-xl text-[11px]">
                  <div>
                    <div className="text-[10px] text-slate-500">Profit Factor</div>
                    <div className="font-mono font-bold text-slate-200">{pb.profitFactor.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Expectancy</div>
                    <div className="font-mono font-bold text-blue-400">{formatCurrency(pb.expectancy)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Missed</div>
                    <div className="font-mono font-bold text-amber-400">{pb.missedTradesCount}</div>
                  </div>
                </div>
              </div>

              {/* Bottom Decorative Curve */}
              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Avg Win: <strong className="text-emerald-400 font-mono">${Math.round(pb.avgWinner)}</strong></span>
                <span>Avg Loss: <strong className="text-rose-400 font-mono">${Math.round(pb.avgLoser)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE PLAYBOOK MODAL (matching Screenshot 4 & 7) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 custom-scrollbar animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-blue-400" />
                Create A+ Trading Playbook
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaybook} className="space-y-4">
              {/* General Information */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  General Information
                </label>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Playbook Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Absorption Reversal, Opening Drive, VWAP Pullback"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Icon / Emoji</label>
                    <div className="flex items-center gap-2">
                      {['🚀', '🟧', '🔄', '🙃', '⚡', '🎯', '🌊'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setIcon(emoji)}
                          className={`text-lg p-1.5 rounded-lg border transition ${
                            icon === emoji ? 'border-blue-500 bg-blue-500/20' : 'border-slate-800 bg-slate-950'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Accent Color</label>
                    <div className="flex items-center gap-2">
                      {['#3b82f6', '#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#ef4444'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            color === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Setup Thesis / Market Premise</label>
                  <input
                    type="text"
                    placeholder="e.g. We are approaching or trading at a high timeframe liquidity zone"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Trading Playbook Rules Builder */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Playbook Execution Rules
                </label>
                <p className="text-[11px] text-slate-400">
                  List your strict non-negotiable rules to calculate rules-followed discipline scores.
                </p>

                {/* Existing Rules List */}
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {rules.map(rule => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {rule.category}
                        </span>
                        <span className="text-slate-200">{rule.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(rule.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Rule Input Row */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={newRuleCategory}
                    onChange={e => setNewRuleCategory(e.target.value as any)}
                    className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="ENTRY">ENTRY</option>
                    <option value="RISK">RISK</option>
                    <option value="EXIT">EXIT</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter rule requirement..."
                    value={newRuleText}
                    onChange={e => setNewRuleText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRule();
                      }
                    }}
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25"
                >
                  Create Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RULE CHECKER POPUP MODAL (matching Screenshot 7) */}
      {activeChecklistPlaybook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeChecklistPlaybook.icon}</span>
                <h3 className="text-sm font-bold text-slate-100">{activeChecklistPlaybook.name}</h3>
              </div>
              <button
                onClick={() => setActiveChecklistPlaybook(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rules Followed Bar (matching Screenshot 7) */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-300">Rules followed</span>
                <span className="font-mono font-bold text-emerald-400">
                  {Object.values(checkedRules).filter(Boolean).length} / {(activeChecklistPlaybook.rules || []).length}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{
                    width: `${(Object.values(checkedRules).filter(Boolean).length / ((activeChecklistPlaybook.rules || []).length || 1)) * 100}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Checklist items by category */}
            <div className="space-y-3 py-2 max-h-64 overflow-y-auto custom-scrollbar">
              {['MARKET', 'ENTRY', 'RISK', 'EXIT'].map(cat => {
                const catRules = (activeChecklistPlaybook.rules || []).filter(r => r.category === cat);
                if (catRules.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {cat}
                    </div>
                    {catRules.map(r => {
                      const isChecked = !!checkedRules[r.id];
                      return (
                        <div
                          key={r.id}
                          onClick={() => setCheckedRules(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer text-xs transition"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <span className={isChecked ? 'text-slate-200' : 'text-slate-400'}>{r.text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setActiveChecklistPlaybook(null);
                  addToast('Rules Verified', 'Discipline score logged for this execution', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
