import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { Trade } from '../../types';

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
  const { addTrade, updateTrade, playbooks, accounts, selectedAccountId } = useTrading();

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
  const [setupType, setSetupType] = useState('Opening Drive');
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
      setSetupType(tradeToEdit.setupType);
      setRulesFollowed(tradeToEdit.rulesFollowed);
      setEmotionalState((tradeToEdit.emotionalState as any) || 'Disciplined');
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
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      setEntryDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
    }
  }, [tradeToEdit, isOpen, selectedAccountId, accounts]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isoEntryDate = new Date(entryDate).toISOString();

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
      setupType,
      session,
      rulesFollowed,
      mistakes,
      emotionalState,
      notes,
      durationMinutes: 35,
      tags: [market, setupType],
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
              <label className="text-xs text-slate-400 mb-1 block">Playbook Setup</label>
              <select
                value={setupType}
                onChange={e => setSetupType(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-blue-400 focus:outline-none focus:border-blue-500"
              >
                {playbooks.map(pb => (
                  <option key={pb.id} value={pb.name}>
                    {pb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Rules Followed & Emotional Baseline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Followed Playbook Rules?</span>
                <span className="text-[10px] text-slate-500">Track your adherence to trade edge</span>
              </div>
              <input
                type="checkbox"
                checked={rulesFollowed}
                onChange={e => setRulesFollowed(e.target.checked)}
                className="h-5 w-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
            </div>

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
