import React, { useState } from 'react';
import {
  X,
  Bot,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Smile,
  Frown,
  Share2,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Trade } from '../../types';
import { generateAiTradeReview, AiTradeReviewResult } from '../../services/geminiAi';

interface TradeDetailDrawerProps {
  trade: Trade | null;
  onClose: () => void;
  onOpenEdit: (trade: Trade) => void;
}

export const TradeDetailDrawer: React.FC<TradeDetailDrawerProps> = ({ trade, onClose, onOpenEdit }) => {
  const {
    playbooks,
    deleteTrade,
    duplicateTrade,
    formatCurrency,
    formatRMultiple,
    addCommunityPost,
    addToast
  } = useTrading();

  const [aiReview, setAiReview] = useState<AiTradeReviewResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  if (!trade) return null;

  const matchedPlaybook = playbooks.find(p => p.name === trade.setupType);
  const isWin = trade.netPnl > 0;
  const isLoss = trade.netPnl < 0;

  const handleRunAiAudit = async () => {
    setIsLoadingAi(true);
    try {
      const result = await generateAiTradeReview(trade, matchedPlaybook);
      setAiReview(result);
      addToast('AI Audit Complete', `Scored ${result.score}/100 with tactical review`, 'success');
    } catch (err) {
      addToast('Error', 'Could not run AI critique', 'error');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleShareToLounge = () => {
    addCommunityPost(
      `Just closed ${trade.symbol} ${trade.direction} for ${formatCurrency(trade.netPnl)} (${formatRMultiple(trade.rMultiple)}). Setup: ${trade.setupType}. Notes: ${trade.notes}`,
      trade.symbol,
      formatCurrency(trade.netPnl),
      formatRMultiple(trade.rMultiple)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide ${
                trade.direction === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {trade.direction}
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {trade.symbol}
                <span className="text-xs font-mono text-slate-400 font-normal">
                  #{trade?.id ? (trade.id.length > 6 ? trade.id.substring(trade.id.length - 6) : trade.id) : ''}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {(trade?.entryDate ? new Date(trade.entryDate) : new Date()).toLocaleString()} • {trade?.session || 'New York'} Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenEdit(trade)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Edit Trade"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => duplicateTrade(trade.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                deleteTrade(trade.id);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-900">
          {/* Main P&L Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Realized Net P&L</span>
              <div
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {formatCurrency(trade.netPnl)}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">R-Multiple</span>
                <span className={`font-bold text-sm ${trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRMultiple(trade.rMultiple)}
                </span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-500 block">Duration</span>
                <span className="font-bold text-sm text-slate-200">{trade.durationMinutes} mins</span>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-500 block">Commission & Fees</span>
                <span className="font-bold text-sm text-slate-400">${trade.commission.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Execution Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Entry Price</span>
              <span className="font-mono font-bold text-slate-100">${trade.entryPrice}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Exit Price</span>
              <span className="font-mono font-bold text-slate-100">{trade.exitPrice ? `$${trade.exitPrice}` : 'Open'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Stop Loss</span>
              <span className="font-mono font-bold text-rose-400">{trade.stopLoss ? `$${trade.stopLoss}` : 'None'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Take Profit</span>
              <span className="font-mono font-bold text-emerald-400">{trade.takeProfit ? `$${trade.takeProfit}` : 'None'}</span>
            </div>
          </div>

          {/* Setup & Discipline Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Assigned Playbook Setup</span>
              <span className="font-bold text-blue-400">{trade.setupType}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Rule Compliance</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  trade.rulesFollowed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {trade.rulesFollowed ? 'Rules strictly followed (100%)' : 'Rule violation detected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Emotional Baseline</span>
              <span className="text-slate-200 font-medium">{trade.emotionalState || 'Disciplined & Calm'}</span>
            </div>
          </div>

          {/* AI Trading Coach Audit Card */}
          <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-300">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                  AI Tactical Trade Audit
                </h3>
              </div>
              {!aiReview && (
                <button
                  onClick={handleRunAiAudit}
                  disabled={isLoadingAi}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 text-xs font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingAi ? 'Auditing...' : 'Run AI Review'}</span>
                </button>
              )}
            </div>

            {aiReview ? (
              <div className="space-y-3 text-xs animate-in fade-in">
                {/* Score badge */}
                <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-blue-500/20">
                  <span className="text-slate-300 font-medium">Execution Quality Score</span>
                  <span className="text-base font-black font-mono text-emerald-400">{aiReview.score} / 100</span>
                </div>

                {/* Executive Summary */}
                <p className="text-slate-200 leading-relaxed font-sans">{aiReview.executiveSummary}</p>

                {/* Strengths */}
                {(aiReview.strengths?.length || 0) > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-emerald-400 uppercase">Key Strengths</div>
                    {aiReview.strengths.map((s, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mistakes */}
                {(aiReview.mistakesIdentified?.length || 0) > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-rose-400 uppercase">Critical Mistakes</div>
                    {aiReview.mistakesIdentified.map((m, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actionable steps */}
                {(aiReview.actionableSteps?.length || 0) > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] font-bold text-blue-400 uppercase">Action Plan for Next Trade</div>
                    {aiReview.actionableSteps.map((step, i) => (
                      <div key={i} className="text-slate-300 font-mono text-[11px]">
                        • {step}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Click "Run AI Review" to generate an institutional critique on execution, R-multiple capture, and psychological bias for this trade.
              </p>
            )}
          </div>

          {/* Trader Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trader Journal Notes
            </label>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
              {trade.notes || 'No custom notes logged for this trade execution.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleShareToLounge}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            <Share2 className="w-4 h-4" />
            <span>Share in Traders Lounge</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close Drawer
          </button>
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
