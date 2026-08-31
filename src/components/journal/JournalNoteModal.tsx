import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Link2,
  Tag as TagIcon,
  Calendar,
  Clock,
  Folder,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Paperclip,
  Trash2,
  Image as ImageIcon,
  FileText,
  Check,
  ChevronDown
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { JournalNote, JournalFolder, Trade, JournalAttachment } from '../../types';
import { SupabaseStorageService } from '../../services/supabaseStorage';

interface JournalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: JournalNote | null;
  defaultFolderId?: string;
  defaultTag?: string | null;
}

const NOTE_TEMPLATES = [
  {
    name: 'Pre-Market & Post-Session',
    content: `Took a long on NQ after the liquidity sweep on 1H.

Price respected the mitigation block and gave a strong displacement.

Managed risk well and moved SL to BE after 1:2 R:R.

Overall a clean trade.`,
    tags: ['Futures', 'A+ Setup'],
  },
  {
    name: 'Morning Session Plan',
    content: `Today I will be focusing on London session liquidity sweeps and watching ES/NQ volume delta during the 9:45 AM opening range drive.

Rules for today:
1. Max 2 executions allowed.
2. Wait for 5m candle close confirmation before market orders.
3. Keep hard stop on every trade.`,
    tags: ['Plan', 'Futures'],
  },
  {
    name: 'Mistake Review & Post-Mortem',
    content: `Took 3 trades in a row without proper setup confirmation.

Recognized that I was reacting emotionally to FOMO after missing the initial move. Chased a green candle without waiting for a retest.

Corrective Action:
- Enforce the 2-trade circuit breaker rule strictly.
- Step away from the screen for at least 30 minutes after any loss.`,
    tags: ['Mistake'],
  },
  {
    name: 'FOMC Reaction Plan',
    content: `### Pre-FOMC Strategy
Pre-FOMC consolidation on tech equities (NVDA, AAPL). Kept position sizing at 50% max allocation until press conference volatility settles.

### Key Focus
- Primary focus on 128.50 key breakout level.
- Flatten all open scalp positions 10m before the rate decision statement.`,
    tags: ['FOMC', 'Equities'],
  }
];

export const JournalNoteModal: React.FC<JournalNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  defaultFolderId = 'f-all',
  defaultTag = null,
}) => {
  const {
    folders,
    trades,
    addNote,
    updateNote,
    addToast,
    formatCurrency,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState('f-trade');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<string>('');
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'Long' | 'Short' | 'BUY' | 'SELL' | ''>('');
  const [setup, setSetup] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [resultR, setResultR] = useState('');
  const [accountName, setAccountName] = useState('');
  const [attachments, setAttachments] = useState<JournalAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setFolderId(noteToEdit.folderId || 'f-trade');
      setDate(noteToEdit.date || new Date().toISOString().split('T')[0]);
      setTime(noteToEdit.time || '6:30 PM');
      setTags(noteToEdit.tags || []);
      setSelectedTradeId(noteToEdit.tradeId || '');
      setSymbol(noteToEdit.symbol || '');
      setSide(noteToEdit.side || '');
      setSetup(noteToEdit.setup || '');
      setTimeframe(noteToEdit.timeframe || '');
      setResultR(noteToEdit.resultR || '');
      setAccountName(noteToEdit.accountName || '');
      setAttachments(noteToEdit.attachments || (noteToEdit.screenshots || []).map((url, i) => ({
        id: `att-${i}`,
        name: `Chart Screenshot #${i + 1}`,
        url,
        type: 'image',
        date: noteToEdit.date,
      })));
    } else {
      const now = new Date();
      setTitle('');
      setContent('');
      setFolderId(defaultFolderId === 'f-all' ? 'f-trade' : defaultFolderId);
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      setTags(defaultTag ? [defaultTag] : ['Futures']);
      setSelectedTradeId('');
      setSymbol('');
      setSide('');
      setSetup('');
      setTimeframe('1H');
      setResultR('');
      setAccountName('Prop Firm');
      setAttachments([]);
    }
  }, [noteToEdit, defaultFolderId, defaultTag, isOpen]);

  // When a trade is linked from the existing trades store
  const handleSelectTrade = (tradeId: string) => {
    setSelectedTradeId(tradeId);
    if (!tradeId) return;

    const tr = trades.find(t => t.id === tradeId);
    if (tr) {
      setSymbol(tr.symbol || '');
      setSide(tr.direction === 'BUY' ? 'Long' : 'Short');
      setSetup(tr.setupType || tr.strategyId || 'Price Action');
      setTimeframe('15m');
      const r = tr.rMultiple !== undefined ? `${tr.rMultiple >= 0 ? '+' : ''}${tr.rMultiple.toFixed(2)}R` : '';
      setResultR(r);
      setAccountName(tr.market === 'Futures' ? 'Prop Firm' : 'Live Trading Account');
      if (!title.trim()) {
        setTitle(`${tr.symbol} : ${new Date(tr.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} Execution`);
      }
      if (!content.trim() && tr.notes) {
        setContent(tr.notes);
      }
      if (tr.tags && tr.tags.length > 0) {
        const merged = Array.from(new Set([...tags, ...tr.tags]));
        setTags(merged);
      }
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileUrl = '';
        try {
          fileUrl = await SupabaseStorageService.uploadJournalScreenshot(file, noteToEdit?.id || 'new');
        } catch {
          // Fallback to local Base64 / blob URL for 100% offline resilience
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newAtt: JournalAttachment = {
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          url: fileUrl,
          type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
          size: file.size,
          date: new Date().toISOString().split('T')[0],
        };

        setAttachments(prev => [...prev, newAtt]);
      }
      addToast('File Attached', 'Attachment added successfully', 'success');
    } catch (err: any) {
      console.error('File upload error:', err);
      addToast('Upload Error', 'Could not process attachment', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleApplyTemplate = (tmpl: typeof NOTE_TEMPLATES[0]) => {
    setContent(tmpl.content);
    const mergedTags = Array.from(new Set([...tags, ...tmpl.tags]));
    setTags(mergedTags);
    if (!title.trim()) {
      setTitle(tmpl.name);
    }
    addToast('Template Applied', tmpl.name, 'info');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Missing Title', 'Please enter a title for this journal note', 'warning');
      return;
    }

    const linkedTrade = trades.find(t => t.id === selectedTradeId);

    const notePayload: Omit<JournalNote, 'id'> = {
      accountId: linkedTrade?.accountId || 'acc-1',
      date,
      time: time || '6:30 PM',
      title: title.trim(),
      folderId: folderId || 'f-trade',
      tags: tags.length > 0 ? tags : ['Futures'],
      content: content.trim() || 'No note content provided.',
      tradeId: selectedTradeId || undefined,
      symbol: symbol.trim() || (selectedTradeId ? linkedTrade?.symbol : undefined),
      side: side ? side : (linkedTrade?.direction === 'BUY' ? 'Long' : linkedTrade?.direction === 'SELL' ? 'Short' : undefined),
      setup: setup.trim() || linkedTrade?.setupType || undefined,
      timeframe: timeframe.trim() || '1H',
      resultR: resultR.trim() || (linkedTrade?.rMultiple !== undefined ? `${linkedTrade.rMultiple >= 0 ? '+' : ''}${linkedTrade.rMultiple.toFixed(2)}R` : undefined),
      accountName: accountName.trim() || (linkedTrade?.market === 'Futures' ? 'Prop Firm' : 'Live Account'),
      attachments,
      screenshots: attachments.filter(a => a.type === 'image').map(a => a.url),
      netPnl: linkedTrade?.netPnl,
      netRoi: linkedTrade?.roiPercent,
      contractsTraded: linkedTrade?.quantity,
      volume: linkedTrade?.quantity,
      isFavorite: noteToEdit?.isFavorite || false,
      isDeleted: false,
    };

    if (noteToEdit) {
      updateNote({
        ...noteToEdit,
        ...notePayload,
        id: noteToEdit.id,
      });
      addToast('Note Updated', title.trim(), 'success');
    } else {
      addNote(notePayload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-3xl max-h-[92vh] rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
            : 'bg-[#0B0F19] border-slate-800 text-slate-100 shadow-2xl shadow-indigo-950/40'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isLight ? 'border-zinc-200 bg-zinc-50/70' : 'border-slate-800/90 bg-[#0E1322]/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {noteToEdit ? 'Edit Journal Entry' : 'Create New Journal Entry'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Log technical thesis, execution takeaways, and link trading statistics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* Quick Template Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Templates</span>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                    isLight
                      ? 'bg-zinc-100 hover:bg-zinc-200/80 border-zinc-200 text-zinc-700'
                      : 'bg-slate-900/60 hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/40 text-slate-300'
                  }`}
                >
                  + {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-300">Note Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. FOMC Day Reaction Trade"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={`w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none border font-medium ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500'
                    : 'bg-[#090D16] border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Folder</label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-[#090D16] border-slate-800 text-slate-200 focus:border-indigo-500'
                }`}
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time & Link Trade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-[#090D16] border-slate-800 text-slate-200 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Time
              </label>
              <input
                type="text"
                placeholder="e.g. 6:30 PM"
                value={time}
                onChange={e => setTime(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border font-mono ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-[#090D16] border-slate-800 text-slate-200 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                Link Trade (Optional)
              </label>
              <select
                value={selectedTradeId}
                onChange={e => handleSelectTrade(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border truncate ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-[#090D16] border-slate-800 text-slate-200 focus:border-indigo-500'
                }`}
              >
                <option value="">-- None (Standalone Note) --</option>
                {trades.map(tr => (
                  <option key={tr.id} value={tr.id}>
                    {tr.symbol} • {tr.direction} • {tr.netPnl !== undefined ? formatCurrency(tr.netPnl) : ''} ({new Date(tr.entryDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trade Metadata Fields (When trade is connected or custom trade data entered) */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isLight
              ? 'bg-zinc-50 border-zinc-200'
              : 'bg-[#0D1220]/70 border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Trade Summary Fields
              </span>
              <span className="text-[10px] text-slate-400">Displayed in note header & summary card</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. NQ"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value.toUpperCase())}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-[#090D16] border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Side</label>
                <select
                  value={side}
                  onChange={e => setSide(e.target.value as any)}
                  className={`w-full rounded-lg px-2 py-1.5 text-xs border focus:outline-none ${
                    isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-[#090D16] border-slate-700 text-white'
                  }`}
                >
                  <option value="">--</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Result (R:R)</label>
                <input
                  type="text"
                  placeholder="+2.45R"
                  value={resultR}
                  onChange={e => setResultR(e.target.value)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold border focus:outline-none ${
                    isLight ? 'bg-white border-zinc-300 text-emerald-600' : 'bg-[#090D16] border-slate-700 text-emerald-400'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Setup</label>
                <input
                  type="text"
                  placeholder="Breaker Block"
                  value={setup}
                  onChange={e => setSetup(e.target.value)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none ${
                    isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-[#090D16] border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Account</label>
                <input
                  type="text"
                  placeholder="Prop Firm"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none ${
                    isLight ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-[#090D16] border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {['FOMC', 'Equities', 'Futures', 'Forex', 'A+ Setup', 'Mistake', 'Plan'].map(preset => {
                const active = tags.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (active) setTags(tags.filter(t => t !== preset));
                      else setTags([...tags, preset]);
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition ${
                      active
                        ? 'bg-purple-950/70 border-purple-600 text-purple-200 font-bold'
                        : isLight
                          ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-600'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400'
                    }`}
                  >
                    {preset} {active ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type custom tag and press Enter..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none border ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-900'
                    : 'bg-[#090D16] border-slate-800 text-slate-200 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Add
              </button>
            </div>

            {/* Currently assigned tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map(t => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800 text-purple-300 flex items-center gap-1"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-purple-400 hover:text-rose-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Note Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Journal Note Content *</label>
            <textarea
              required
              rows={7}
              placeholder="Took a long on NQ after the liquidity sweep on 1H. Price respected the mitigation block and gave a strong displacement..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className={`w-full rounded-xl p-3.5 text-xs leading-relaxed font-mono focus:outline-none border custom-scrollbar ${
                isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500'
                  : 'bg-[#090D16] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Attachments & Screenshots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                Attachments & Chart Screenshots
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold flex items-center gap-1.5 transition"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              </button>
            </div>

            {/* Attachments List */}
            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {att.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span className="text-xs text-slate-200 truncate">{att.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  isLight
                    ? 'border-zinc-300 hover:border-blue-400 bg-zinc-50'
                    : 'border-slate-800 hover:border-indigo-500/50 bg-[#090D16]/50'
                }`}
              >
                <p className="text-xs text-slate-400">Click to attach charts, trade screenshots, or PDFs (up to 10MB)</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-2.5 px-6 py-3.5 border-t shrink-0 ${
          isLight ? 'border-zinc-200 bg-zinc-50' : 'border-slate-800/90 bg-[#0E1322]'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            {noteToEdit ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
};
