import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Save,
  Tag,
  Star,
  ShieldAlert,
  Clock,
  DollarSign,
  Scale,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { ReplayTrade } from '../types';

interface TradeJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: ReplayTrade | null;
  onUpdateTrade: (updatedTrade: ReplayTrade) => void;
  formatCurrency: (val: number) => string;
}

export const TradeJournalModal: React.FC<TradeJournalModalProps> = ({
  isOpen,
  onClose,
  trade,
  onUpdateTrade,
  formatCurrency,
}) => {
  if (!isOpen || !trade) return null;

  const [strategySetup, setStrategySetup] = useState<string>(trade.strategySetup || 'Liquidity Sweep');
  const [marketCondition, setMarketCondition] = useState<string>(trade.marketCondition || 'Trending Bull');
  const [sessionTag, setSessionTag] = useState<string>(trade.sessionTag || 'New York');
  const [tagsInput, setTagsInput] = useState<string>(trade.tags?.join(', ') || 'A+ Setup');
  const [mistakeTag, setMistakeTag] = useState<string>(trade.mistakeTag || 'None');
  const [disciplineRating, setDisciplineRating] = useState<number>(trade.disciplineRating || 5);
  const [notesBefore, setNotesBefore] = useState<string>(trade.notesBefore || '');
  const [notesDuring, setNotesDuring] = useState<string>(trade.notesDuring || '');
  const [notesAfter, setNotesAfter] = useState<string>(trade.notesAfter || '');
  const [lessonsLearned, setLessonsLearned] = useState<string>(trade.lessonsLearned || '');
  const [imageAttachment, setImageAttachment] = useState<string>(trade.imageAttachment || '');

  const handleSave = () => {
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const updated: ReplayTrade = {
      ...trade,
      strategySetup,
      marketCondition,
      sessionTag,
      tags: parsedTags,
      mistakeTag,
      disciplineRating,
      notesBefore: notesBefore.trim() || undefined,
      notesDuring: notesDuring.trim() || undefined,
      notesAfter: notesAfter.trim() || undefined,
      lessonsLearned: lessonsLearned.trim() || undefined,
      imageAttachment: imageAttachment.trim() || undefined,
    };

    onUpdateTrade(updated);
    onClose();
  };

  const isWin = trade.realizedPnl > 0;
  const isBE = trade.realizedPnl === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Trade Journal & Review</h2>
                <span className="text-xs font-mono text-slate-500">#{trade.id.slice(-6)}</span>
              </div>
              <p className="text-xs text-slate-400">
                Log execution thesis, emotional discipline, mistakes, and post-trade learnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trade Summary Banner */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Instrument & Side</div>
            <div className="flex items-center gap-1.5 mt-0.5 font-bold text-white">
              <span>{trade.symbol}</span>
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                  trade.direction === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {trade.direction === 'BUY' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {trade.direction} {trade.lotSize}L
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Realized Net P&L</div>
            <div
              className={`mt-0.5 font-bold text-sm ${
                isWin ? 'text-emerald-400' : isBE ? 'text-slate-400' : 'text-rose-400'
              }`}
            >
              {isWin ? '+' : ''}
              {formatCurrency(trade.realizedPnl)}{' '}
              <span className="text-[11px]">({trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple.toFixed(2)}R)</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Execution Prices</div>
            <div className="mt-0.5 text-slate-300">
              In: {trade.entryPrice} → Out: {trade.exitPrice}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans font-bold">Execution Costs</div>
            <div className="mt-0.5 text-slate-400 text-[11px]">
              Comm: {formatCurrency(trade.commission || 0)} • Spread: {formatCurrency(trade.spreadCost || 0)}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
          {/* Setup & Market Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Strategy / Setup</label>
              <select
                value={strategySetup}
                onChange={e => setStrategySetup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Liquidity Sweep">Liquidity Sweep</option>
                <option value="Fair Value Gap">Fair Value Gap (FVG)</option>
                <option value="Break & Retest">Break & Retest</option>
                <option value="Order Block">Order Block (OB)</option>
                <option value="Trend Continuation">Trend Continuation</option>
                <option value="Mean Reversion">Mean Reversion</option>
                <option value="Breakout">Breakout / S&R</option>
                <option value="ICT Silver Bullet">ICT Silver Bullet</option>
                <option value="Discretionary">Discretionary</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Market Condition</label>
              <select
                value={marketCondition}
                onChange={e => setMarketCondition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Trending Bull">Trending Bull</option>
                <option value="Trending Bear">Trending Bear</option>
                <option value="Ranging / Chop">Ranging / Chop</option>
                <option value="High Volatility">High Volatility</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Trading Session</label>
              <select
                value={sessionTag}
                onChange={e => setSessionTag(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="London">London (08:00-16:00)</option>
                <option value="New York">New York (13:00-21:00)</option>
                <option value="Asian / Tokyo">Asian / Tokyo (00:00-08:00)</option>
                <option value="Sydney">Sydney (21:00-05:00)</option>
              </select>
            </div>
          </div>

          {/* Mistakes & Discipline Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Execution Mistake Tag</span>
              </label>
              <select
                value={mistakeTag}
                onChange={e => setMistakeTag(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="None">None (Followed Plan Strictly)</option>
                <option value="FOMO Entry">FOMO Entry (Chased Price)</option>
                <option value="Overleveraged">Overleveraged (Risked Too Much)</option>
                <option value="Moved SL">Moved Stop Loss (Violated Invalidation)</option>
                <option value="Early Exit">Early Exit (Cut Winners Too Soon)</option>
                <option value="Revenge Trade">Revenge Trade (Emotional Tilt)</option>
                <option value="Ignored Trend">Counter-Trend Against HTF Flow</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Discipline Rating (1 - 5)</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDisciplineRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        disciplineRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-300 ml-2 font-mono">
                  {disciplineRating} / 5
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Custom Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. A+ Setup, HTF Confluence, News Event, ICT"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Journal Note Stages */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">1. Pre-Trade Thesis & Setup Context</label>
              <textarea
                rows={2}
                value={notesBefore}
                onChange={e => setNotesBefore(e.target.value)}
                placeholder="What was your setup criteria, key levels, and risk model prior to entry?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">2. In-Trade Management Notes</label>
              <textarea
                rows={2}
                value={notesDuring}
                onChange={e => setNotesDuring(e.target.value)}
                placeholder="Did you trail SL, take partials, or feel emotional pressure while price was developing?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">3. Post-Trade Review & Lessons Learned</label>
              <textarea
                rows={2}
                value={lessonsLearned}
                onChange={e => setLessonsLearned(e.target.value)}
                placeholder="What did you do right? What will you do better next time?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Screenshot / Chart URL Attachment</span>
              </label>
              <input
                type="text"
                value={imageAttachment}
                onChange={e => setImageAttachment(e.target.value)}
                placeholder="https://... or chart snapshot URL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Journal Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
