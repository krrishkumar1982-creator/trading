import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, BookOpen, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TradingJournalTemplateCalcProps {
  onClose: () => void;
}

export const TradingJournalTemplateCalc: React.FC<TradingJournalTemplateCalcProps> = ({ onClose }) => {
  const { addTrade, accounts, selectedAccountId } = useTrading();

  // Form Inputs
  const [symbol, setSymbol] = useState('AAPL');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('150');
  const [exitPrice, setExitPrice] = useState('155');
  const [quantity, setQuantity] = useState('10');
  const [setupType, setSetupType] = useState('Golden Pocket Retracement');
  const [notes, setNotes] = useState('Perfect bounce at 0.618 level with volume conformation.');
  const [rulesFollowed, setRulesFollowed] = useState<boolean>(true);
  
  const [isLogged, setIsLogged] = useState(false);

  const handleReset = () => {
    setSymbol('AAPL');
    setDirection('BUY');
    setEntryPrice('150');
    setExitPrice('155');
    setQuantity('10');
    setSetupType('Golden Pocket Retracement');
    setNotes('');
    setRulesFollowed(true);
    setIsLogged(false);
  };

  const handleLogTrade = (e: React.FormEvent) => {
    e.preventDefault();

    const entry = parseFloat(entryPrice) || 0;
    const exit = parseFloat(exitPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    
    // Simple math
    const grossPnl = direction === 'BUY' ? (exit - entry) * qty : (entry - exit) * qty;
    const commission = 1.50; // flat
    const netPnl = grossPnl - commission;

    // Dispatch to global TradeForge state
    addTrade({
      accountId: selectedAccountId || (accounts[0] ? accounts[0].id : 'default-id'),
      symbol: symbol.toUpperCase(),
      market: 'Stocks',
      direction,
      status: 'CLOSED',
      entryDate: new Date().toISOString(),
      exitDate: new Date().toISOString(),
      entryPrice: entry,
      exitPrice: exit,
      quantity: qty,
      grossPnl,
      netPnl,
      commission,
      swap: 0,
      fees: 0.15,
      rMultiple: parseFloat((netPnl / 100).toFixed(2)), // simple scale
      roiPercent: parseFloat(((netPnl / (entry * qty)) * 100).toFixed(2)),
      session: 'New York',
      setupType,
      rating: 5,
      notes,
      tags: [setupType, 'institutional-calculator'],
      mistakes: [],
      rulesFollowed,
      durationMinutes: 45,
    });

    setIsLogged(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Journal Template</h4>
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
          >
            <RefreshCw className="w-3 h-3" /> Clear Form
          </button>
        </div>

        {isLogged ? (
          <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Trade Registered Successfully</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                This trade has been recorded in the central TradeForge database and is now visible on your Dashboard, Journal, and Reports pages.
              </p>
            </div>
            <button
              onClick={() => setIsLogged(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
            >
              Log Another Trade
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogTrade} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Contract Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'BUY' | 'SELL')}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BUY">Long (BUY)</option>
                    <option value="SELL">Short (SELL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shares Sizing</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Entry Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block font-mono">Exit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Setup Category</label>
                <input
                  type="text"
                  value={setupType}
                  onChange={(e) => setSetupType(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Post-Trade Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Rules followed?</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesFollowed}
                    onChange={(e) => setRulesFollowed(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">100% Compliant</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
              >
                <BookOpen className="w-4 h-4" /> Save Entry to TradeForge Database
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
