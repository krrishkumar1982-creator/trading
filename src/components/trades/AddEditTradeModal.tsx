import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Save,
  DollarSign,
  TrendingUp,
  Clock,
  BookmarkCheck,
  Smile,
  AlertTriangle,
  Calculator,
  Sparkles,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Trade } from '../../types';
import { SupabaseStorageService } from '../../services/supabaseStorage';

interface AddEditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeToEdit?: Trade | null;
}

export const AddEditTradeModal: React.FC<AddEditTradeModalProps> = ({
  isOpen,
  onClose,
  tradeToEdit,
}) => {
  const { addTrade, updateTrade, playbooks, accounts, selectedAccountId, riskGoals, trades, addToast } = useTrading();
  const [formError, setFormError] = useState<string>('');

  // Form fields
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-1');
  const [symbol, setSymbol] = useState('MES');
  const [market, setMarket] = useState<'Futures' | 'Forex' | 'Crypto' | 'Stocks'>('Futures');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [status, setStatus] = useState<'CLOSED' | 'OPEN'>('CLOSED');
  const [entryPrice, setEntryPrice] = useState('5642.50');
  const [exitPrice, setExitPrice] = useState('5668.00');
  const [stopLoss, setStopLoss] = useState('5634.50');
  const [takeProfit, setTakeProfit] = useState('5670.00');
  const [quantity, setQuantity] = useState('5');
  const [commission, setCommission] = useState('12.50');
  const [session, setSession] = useState<'New York' | 'London' | 'Asian'>('New York');
  const [playbookId, setPlaybookId] = useState<string>(playbooks[0]?.id || '');
  const [setupId, setSetupId] = useState<string>('');
  const [setupType, setSetupType] = useState('Opening Drive');
  const [setupGrade, setSetupGrade] = useState<'A+' | 'A' | 'B' | 'C' | 'D' | ''>('');
  const [checkedRuleIds, setCheckedRuleIds] = useState<string[]>([]);
  const [mistakeCategory, setMistakeCategory] = useState<string>('Entry Discipline');
  const [mistakeDescription, setMistakeDescription] = useState<string>('');
  const [mistakeSeverity, setMistakeSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [rulesFollowed, setRulesFollowed] = useState(true);
  const [emotionalState, setEmotionalState] = useState<'Disciplined' | 'FOMO' | 'Revenge' | 'Hesitant' | 'Greedy'>('Disciplined');
  const [entryDate, setEntryDate] = useState(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [notes, setNotes] = useState('Strong morning liquidity sweep. Held until liquidity target reached.');
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [newMistake, setNewMistake] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [afterScreenshotUrl, setAfterScreenshotUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await SupabaseStorageService.uploadTradeScreenshot(file, tradeToEdit?.id);
      setScreenshotUrl(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload trade screenshot:', err);
    } finally {
      setIsUploadingImage(false);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (tradeToEdit) {
      setAccountId(tradeToEdit.accountId);
      setSymbol(tradeToEdit.symbol);
      setMarket(tradeToEdit.market as any);
      setDirection(tradeToEdit.direction);
      setStatus(tradeToEdit.status);
      setEntryPrice(tradeToEdit.entryPrice.toString());
      setExitPrice(tradeToEdit.exitPrice ? tradeToEdit.exitPrice.toString() : '');
      setStopLoss(tradeToEdit.stopLoss ? tradeToEdit.stopLoss.toString() : '');
      setTakeProfit(tradeToEdit.takeProfit ? tradeToEdit.takeProfit.toString() : '');
      setQuantity(tradeToEdit.quantity.toString());
      setCommission(tradeToEdit.commission.toString());
      setSession(tradeToEdit.session as any);
      
      const foundPb = playbooks.find(p => p.id === tradeToEdit.playbookId)
        || playbooks.find(p => p.name === tradeToEdit.setupType)
        || playbooks[0];

      const pbIdToSet = foundPb?.id || tradeToEdit.playbookId || '';
      setPlaybookId(pbIdToSet);
      setSetupType(foundPb?.name || tradeToEdit.setupType || '');
      setSetupId(tradeToEdit.setupId || '');
      setSetupGrade(tradeToEdit.setupGrade || '');

      if (tradeToEdit.checkedRuleIds && Array.isArray(tradeToEdit.checkedRuleIds)) {
        setCheckedRuleIds(tradeToEdit.checkedRuleIds);
      } else if (foundPb && foundPb.rules && foundPb.rules.length > 0) {
        if (tradeToEdit.rulesFollowed) {
          setCheckedRuleIds(foundPb.rules.map(r => r.id));
        } else {
          setCheckedRuleIds([]);
        }
      } else {
        setCheckedRuleIds([]);
      }

      setRulesFollowed(tradeToEdit.rulesFollowed);
      setMistakeCategory(tradeToEdit.mistakeCategory || 'Entry Discipline');
      setMistakeDescription(tradeToEdit.mistakeDescription || '');
      setMistakeSeverity(tradeToEdit.mistakeSeverity || 'Medium');
      setEmotionalState((tradeToEdit.emotionalState as any) || 'Disciplined');
      setScreenshotUrl(tradeToEdit.screenshotUrl || '');
      setAfterScreenshotUrl(tradeToEdit.afterScreenshotUrl || '');
      if (tradeToEdit.entryDate) {
        const d = new Date(tradeToEdit.entryDate);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => n.toString().padStart(2, '0');
          setEntryDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      }
      setNotes(tradeToEdit.notes || '');
      setMistakes(tradeToEdit.mistakes || []);
    } else {
      setAccountId(selectedAccountId === 'all' ? (accounts[0]?.id || 'acc-1') : selectedAccountId);
      const defaultPb = playbooks[0];
      setPlaybookId(defaultPb?.id || '');
      setSetupType(defaultPb?.name || '');
      setSetupId('');
      setSetupGrade('');
      setCheckedRuleIds(defaultPb?.rules ? defaultPb.rules.map(r => r.id) : []);
      setMistakeCategory('Entry Discipline');
      setMistakeDescription('');
      setMistakeSeverity('Medium');
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setEntryDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
      setScreenshotUrl('');
      setAfterScreenshotUrl('');
    }
  }, [tradeToEdit, isOpen, selectedAccountId, accounts, playbooks]);

  if (!isOpen) return null;

  // Real-time calculated fields
  const numEntry = parseFloat(entryPrice) || 0;
  const numExit = parseFloat(exitPrice) || numEntry;
  const numSL = parseFloat(stopLoss) || (direction === 'BUY' ? numEntry - 5 : numEntry + 5);
  const numQty = parseFloat(quantity) || 1;
  const numComm = parseFloat(commission) || 0;

  const pointDiff = direction === 'BUY' ? (numExit - numEntry) : (numEntry - numExit);
  const multiplier = market === 'Futures' ? (symbol === 'MES' ? 5 : symbol === 'ES' ? 50 : symbol === 'NQ' ? 20 : 1) : 1;
  const grossPnl = pointDiff * numQty * multiplier;
  const netPnl = grossPnl - numComm;

  const riskPerUnit = Math.abs(numEntry - numSL) * multiplier || 1;
  const totalRisk = riskPerUnit * numQty || 1;
  const rMultiple = parseFloat((grossPnl / totalRisk).toFixed(2));

  // Determine selected playbook by exact ID first, then fallback to name match, then first playbook
  const selectedPlaybook =
    playbooks.find(p => p.id === playbookId) ||
    playbooks.find(p => p.name === setupType) ||
    playbooks[0];

  const activeRules = selectedPlaybook?.rules || [];
  const activeSetups = selectedPlaybook?.setups || [];

  const totalRulesCount = activeRules.length;
  // Calculate checked count using rules that actually belong to the currently selected playbook
  const checkedCount = activeRules.filter(r => checkedRuleIds.includes(r.id)).length;
  const compliancePct = totalRulesCount > 0 ? Math.round((checkedCount / totalRulesCount) * 100) : 0;

  const suggestedGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'N/A' = (() => {
    if (totalRulesCount === 0) return 'N/A';
    if (compliancePct >= 90) return 'A+';
    if (compliancePct >= 80) return 'A';
    if (compliancePct >= 70) return 'B';
    if (compliancePct >= 60) return 'C';
    return 'D';
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!tradeToEdit) {
      // Risk & Circuit Breaker pre-trade entry validation
      const todayStr = new Date().toISOString().split('T')[0];
      const todayClosedTrades = trades.filter(t => t.entryDate && t.entryDate.startsWith(todayStr) && t.status === 'CLOSED');
      const todayNet = todayClosedTrades.reduce((acc, t) => acc + (t.netPnl || 0), 0);
      const todayLossAbs = todayNet < 0 ? Math.abs(todayNet) : 0;
      const todayTradesCount = trades.filter(t => t.entryDate && t.entryDate.startsWith(todayStr)).length;

      const isCircuitBreakerActive =
        riskGoals.circuitBreakerTriggered ||
        riskGoals.circuitBreakerState === 'TRIGGERED' ||
        (riskGoals.dailyMaxLoss && riskGoals.dailyMaxLoss > 0 && todayLossAbs >= riskGoals.dailyMaxLoss);

      if (isCircuitBreakerActive) {
        const errorMsg = `🚨 Circuit Breaker Active: Daily loss limit reached ($${todayLossAbs.toFixed(2)} / $${riskGoals.dailyMaxLoss}). Trade entries locked.`;
        setFormError(errorMsg);
        addToast('Trade Entry Blocked', 'Circuit Breaker is active due to daily loss limit breach.', 'error');
        return;
      }

      if (riskGoals.maxTradesPerDay && riskGoals.maxTradesPerDay > 0 && todayTradesCount >= riskGoals.maxTradesPerDay) {
        const errorMsg = `🚨 Risk Limit Breached: Daily trade quota reached (${todayTradesCount} / ${riskGoals.maxTradesPerDay} trades).`;
        setFormError(errorMsg);
        addToast('Trade Entry Blocked', `Maximum daily trade count (${riskGoals.maxTradesPerDay}) reached.`, 'error');
        return;
      }

      if (riskGoals.maxContractsPerTrade && riskGoals.maxContractsPerTrade > 0 && numQty > riskGoals.maxContractsPerTrade) {
        const errorMsg = `🚨 Position Size Error: Position size (${numQty}) exceeds maximum allowed limit of ${riskGoals.maxContractsPerTrade} contracts.`;
        setFormError(errorMsg);
        addToast('Trade Entry Blocked', `Position size exceeds max allowed limit of ${riskGoals.maxContractsPerTrade} contracts.`, 'error');
        return;
      }
    }

    const isoEntryDate = new Date(entryDate).toISOString();
    const finalGrade = setupGrade || (suggestedGrade !== 'N/A' ? suggestedGrade : 'A+');

    const tradeData = {
      accountId,
      symbol: symbol.toUpperCase(),
      market,
      direction,
      status,
      entryDate: isoEntryDate,
      exitDate: status === 'CLOSED' ? isoEntryDate : undefined,
      entryPrice: numEntry,
      exitPrice: status === 'CLOSED' ? numExit : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      quantity: numQty,
      commission: numComm,
      swap: 0,
      fees: 0,
      grossPnl,
      netPnl,
      rMultiple,
      roiPercent: parseFloat(((netPnl / (numEntry * numQty)) * 100).toFixed(2)),
      rating: 5,
      playbookId: selectedPlaybook?.id || playbookId,
      setupId: setupId || undefined,
      setupType: selectedPlaybook?.name || setupType || 'General',
      setupGrade: finalGrade as any,
      autoGrade: suggestedGrade !== 'N/A' ? (suggestedGrade as any) : undefined,
      ruleCompliancePercent: totalRulesCount > 0 ? compliancePct : undefined,
      checkedRuleIds,
      mistakeCategory: totalRulesCount > 0 && compliancePct < 100 ? mistakeCategory : undefined,
      mistakeDescription: totalRulesCount > 0 && compliancePct < 100 ? mistakeDescription : undefined,
      mistakeSeverity: totalRulesCount > 0 && compliancePct < 100 ? mistakeSeverity : undefined,
      session,
      rulesFollowed: totalRulesCount > 0 ? compliancePct === 100 : true,
      mistakes: totalRulesCount > 0 && compliancePct < 100 && mistakeDescription ? [...mistakes, mistakeDescription] : mistakes,
      emotionalState,
      notes,
      durationMinutes: 35,
      tags: [market, selectedPlaybook?.name || setupType || 'General'],
      screenshotUrl: screenshotUrl || undefined,
      afterScreenshotUrl: afterScreenshotUrl || undefined,
    };

    if (tradeToEdit) {
      updateTrade({ ...tradeData, id: tradeToEdit.id });
    } else {
      addTrade(tradeData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 custom-scrollbar animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            {tradeToEdit ? 'Edit Logged Trade' : 'Log New Execution'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-950/90 border border-rose-600 rounded-xl text-xs font-bold text-rose-200 flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              {formError}
            </span>
            <button type="button" onClick={() => setFormError('')} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Real-time Calculation Header Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500">Calculated Net P&L</span>
              <div className={`text-base font-mono font-extrabold ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${netPnl.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Calculated R-Multiple</span>
              <div className={`text-base font-mono font-bold ${rMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rMultiple >= 0 ? '+' : ''}{rMultiple}R
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Gross P&L</span>
              <div className="text-base font-mono font-bold text-slate-200">${grossPnl.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Total Initial Risk</span>
              <div className="text-base font-mono font-bold text-rose-400">${totalRisk.toFixed(2)}</div>
            </div>
          </div>

          {/* Row 1: Symbol, Direction, Status, Market, Entry Date & Time */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Symbol / Ticker</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-100 uppercase focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Direction</label>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="BUY">BUY / LONG</option>
                <option value="SELL">SELL / SHORT</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Trade Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="CLOSED">CLOSED</option>
                <option value="OPEN">OPEN / ACTIVE</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Market Asset</label>
              <select
                value={market}
                onChange={e => setMarket(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Futures">Futures (MES/NQ/ES)</option>
                <option value="Forex">Forex</option>
                <option value="Stocks">Equities</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-slate-400 mb-1 block">Entry Date & Time</label>
              <input
                type="datetime-local"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-2 text-[11px] font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Entry, Exit, Stop Loss, Take Profit */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Exit Price ($)</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={e => setExitPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-rose-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Take Profit ($)</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Contracts, Commission, Session, Setup */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Position Size (Contracts/Lots)</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Commission & Fees ($)</label>
              <input
                type="number"
                step="any"
                value={commission}
                onChange={e => setCommission(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Trading Session</label>
              <select
                value={session}
                onChange={e => setSession(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="New York">New York (NYSE / CME)</option>
                <option value="London">London (LSE)</option>
                <option value="Asian">Asia / Tokyo</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Strategy Playbook</label>
              <select
                value={selectedPlaybook?.id || playbookId}
                onChange={e => {
                  const pid = e.target.value;
                  setPlaybookId(pid);
                  const found = playbooks.find(p => p.id === pid);
                  if (found) {
                    setSetupType(found.name);
                    setSetupId('');
                    setSetupGrade('');
                    setCheckedRuleIds(found.rules ? found.rules.map(r => r.id) : []);
                  } else {
                    setSetupType('');
                    setSetupId('');
                    setSetupGrade('');
                    setCheckedRuleIds([]);
                  }
                }}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-400 focus:outline-none focus:border-blue-500"
              >
                {playbooks.map(pb => (
                  <option key={pb.id} value={pb.id}>
                    {pb.icon || '📘'} {pb.name} ({pb.market || 'All'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Playbook Rules Checklist & Setup Details Card */}
          {selectedPlaybook && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">Playbook Rules Checklist & Grading</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Compliance:</span>
                  <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${
                    totalRulesCount === 0
                      ? 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                      : compliancePct === 100
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {totalRulesCount > 0 ? `${checkedCount} / ${totalRulesCount} (${compliancePct}%)` : '0 / 0 (N/A)'}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-1">Auto Grade:</span>
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                    {suggestedGrade}
                  </span>
                </div>
              </div>

              {/* Sub Setups & Manual Grade Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeSetups.length > 0 && (
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">A+ Specific Setup Variation</label>
                    <select
                      value={setupId}
                      onChange={e => setSetupId(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Default Strategy Setup</option>
                      {activeSetups.map(st => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Override Final Grade (Optional)</label>
                  <select
                    value={setupGrade}
                    onChange={e => setSetupGrade(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Auto Grade ({totalRulesCount > 0 ? suggestedGrade : 'N/A'})</option>
                    <option value="A+">Grade A+ (Flawless Execution)</option>
                    <option value="A">Grade A (Great Execution)</option>
                    <option value="B">Grade B (Minor Deviation)</option>
                    <option value="C">Grade C (Sub-optimal)</option>
                    <option value="D">Grade D (Rule Violation)</option>
                  </select>
                </div>
              </div>

              {/* Interactive Rule Checkboxes */}
              {activeRules.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Verify Rule Conditions:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeRules.map(rule => {
                      const isChecked = checkedRuleIds.includes(rule.id);
                      return (
                        <label
                          key={rule.id}
                          className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-slate-900/90 border-blue-500/40 text-slate-100'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCheckedRuleIds(prev => prev.filter(id => id !== rule.id));
                              } else {
                                setCheckedRuleIds(prev => [...prev, rule.id]);
                              }
                            }}
                            className="mt-0.5 h-4 w-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block leading-snug">{rule.text}</span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">{rule.category || 'RULE'} • {rule.required ? 'REQUIRED' : 'OPTIONAL'}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
                  <p className="text-xs text-slate-400 italic">No rules configured for this playbook.</p>
                </div>
              )}

              {/* Mistake Recording if compliance < 100% and totalRulesCount > 0 */}
              {totalRulesCount > 0 && compliancePct < 100 && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Rule Violation Recorded ({100 - compliancePct}% missing)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Mistake Category</label>
                      <select
                        value={mistakeCategory}
                        onChange={e => setMistakeCategory(e.target.value)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-200"
                      >
                        <option value="Entry Discipline">Entry Discipline</option>
                        <option value="Risk Management">Risk Management</option>
                        <option value="Patience / Confirmation">Patience / Confirmation</option>
                        <option value="FOMO / Chasing">FOMO / Chasing</option>
                        <option value="Exit & Trade Management">Exit & Trade Management</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Severity</label>
                      <select
                        value={mistakeSeverity}
                        onChange={e => setMistakeSeverity(e.target.value as any)}
                        className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-200"
                      >
                        <option value="Low">Low Severity</option>
                        <option value="Medium">Medium Severity</option>
                        <option value="High">High Severity</option>
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Briefly describe what went wrong or why rule was skipped..."
                    value={mistakeDescription}
                    onChange={e => setMistakeDescription(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-100 placeholder:text-slate-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Row 4: Emotional Baseline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Emotional State at Execution</label>
              <select
                value={emotionalState}
                onChange={e => setEmotionalState(e.target.value as any)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Disciplined">Disciplined & Calm 🧘</option>
                <option value="FOMO">FOMO (Chasing Move) 🏃</option>
                <option value="Revenge">Revenge / Frustrated 😡</option>
                <option value="Hesitant">Hesitant / Scared 😨</option>
                <option value="Greedy">Greedy / Overleveraged 🤑</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Execution Notes & Review</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What triggered this entry? How was the exit managed?"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Screenshot Upload (Supabase Storage) */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Trade Chart Attachment</span>
              </label>
              <input
                type="file"
                ref={screenshotInputRef}
                onChange={handleScreenshotUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => screenshotInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                <span>{isUploadingImage ? 'Uploading...' : screenshotUrl ? 'Change Screenshot' : 'Upload Chart'}</span>
              </button>
            </div>
            {screenshotUrl && (
              <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-36 bg-slate-900 flex items-center justify-center">
                <img src={screenshotUrl} alt="Trade chart" className="max-h-36 object-contain" />
                <button
                  type="button"
                  onClick={() => setScreenshotUrl('')}
                  className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/80 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-[10px]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25"
            >
              {tradeToEdit ? 'Save Changes' : 'Log Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
