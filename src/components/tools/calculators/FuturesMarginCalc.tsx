import React, { useState, useEffect } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, ShieldAlert, CheckCircle } from 'lucide-react';

interface FuturesMarginCalcProps {
  onClose: () => void;
}

export const FuturesMarginCalc: React.FC<FuturesMarginCalcProps> = ({ onClose }) => {
  const { accounts, selectedAccountId, formatCurrency } = useTrading();

  // Find active account to prefill balance
  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const initialBalance = activeAccount ? activeAccount.currentBalance.toString() : '50000';

  // Inputs
  const [balance, setBalance] = useState(initialBalance);
  const [symbol, setSymbol] = useState('NQ');
  const [contracts, setContracts] = useState('2');
  const [sessionMode, setSessionMode] = useState<'DAY' | 'OVERNIGHT'>('DAY');

  // Specs
  const [initMargin, setInitMargin] = useState(18480);
  const [maintMargin, setMaintMargin] = useState(16800);
  const [dayMargin, setDayMargin] = useState(1000);

  useEffect(() => {
    if (symbol === 'ES') {
      setInitMargin(12980); setMaintMargin(11800); setDayMargin(500);
    } else if (symbol === 'MES') {
      setInitMargin(1298); setMaintMargin(1180); setDayMargin(50);
    } else if (symbol === 'NQ') {
      setInitMargin(18480); setMaintMargin(16800); setDayMargin(1000);
    } else if (symbol === 'MNQ') {
      setInitMargin(1848); setMaintMargin(1680); setDayMargin(100);
    } else if (symbol === 'CL') {
      setInitMargin(7260); setMaintMargin(6600); setDayMargin(1000);
    } else if (symbol === 'GC') {
      setInitMargin(9350); setMaintMargin(8500); setDayMargin(1000);
    }
  }, [symbol]);

  const handleReset = () => {
    setBalance(initialBalance);
    setSymbol('NQ');
    setContracts('2');
    setSessionMode('DAY');
  };

  const balVal = parseFloat(balance) || 0;
  const cCount = parseFloat(contracts) || 1;

  // Margin Required Calculations
  const requiredMargin = sessionMode === 'DAY' ? dayMargin * cCount : initMargin * cCount;
  const requiredMaintMargin = sessionMode === 'DAY' ? dayMargin * cCount : maintMargin * cCount;
  
  const cushion = balVal - requiredMargin;
  const maxContractsDay = Math.floor(balVal / dayMargin);
  const maxContractsOvernight = Math.floor(balVal / initMargin);

  const isMarginBreached = balVal < requiredMargin;
  const isMarginWarning = balVal < requiredMargin * 1.25 && !isMarginBreached;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Margin Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Account Balance ($)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contract Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="NQ">E-mini Nasdaq-100 (NQ)</option>
                <option value="MNQ">Micro Nasdaq-100 (MNQ)</option>
                <option value="ES">E-mini S&P 500 (ES)</option>
                <option value="MES">Micro S&P 500 (MES)</option>
                <option value="CL">Crude Oil (CL)</option>
                <option value="GC">Gold (GC)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Margin Sizing Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSessionMode('DAY')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    sessionMode === 'DAY' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Intraday
                </button>
                <button
                  onClick={() => setSessionMode('OVERNIGHT')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    sessionMode === 'OVERNIGHT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Overnight
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Contracts to Trade</label>
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Day / Overnight comparison specs table */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Day Sizing Margin (Intraday)</span>
              <span className="font-mono text-slate-200">${dayMargin.toLocaleString()} / contract</span>
            </div>
            <div className="flex justify-between">
              <span>CME Initial Margin (Overnight)</span>
              <span className="font-mono text-slate-200">${initMargin.toLocaleString()} / contract</span>
            </div>
            <div className="flex justify-between">
              <span>CME Maintenance Margin</span>
              <span className="font-mono text-slate-200">${maintMargin.toLocaleString()} / contract</span>
            </div>
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Margin Health Indicators</h4>

          {/* State banner */}
          {isMarginBreached ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-900/50 text-rose-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <strong className="block font-black uppercase">Margin Breach Alert</strong>
                Your account balance is too low to execute these contracts under standard CME guidelines.
              </div>
            </div>
          ) : isMarginWarning ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-900/50 text-amber-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <strong className="block font-black uppercase">Margin Level Caution</strong>
                Cushion is extremely tight. Small unfavorable ticks can trigger automated broker liquidations.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <strong className="block font-black uppercase">Margin Sizing Compliant</strong>
                Account contains sufficient margin cushion to hold these contracts safely.
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Required Margin</span>
              <div className="text-xl font-black text-slate-100 mt-1 font-mono">
                {formatCurrency(requiredMargin)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Account Cushion</span>
              <div className={`text-xl font-black mt-1 font-mono ${cushion < 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {formatCurrency(cushion)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Day Contracts</span>
              <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                {maxContractsDay} Contracts
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Overnight Contracts</span>
              <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                {maxContractsOvernight} Contracts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
