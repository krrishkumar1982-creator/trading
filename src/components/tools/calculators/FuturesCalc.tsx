import React, { useState, useEffect } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, Coins } from 'lucide-react';

interface FuturesCalcProps {
  onClose: () => void;
}

export const FuturesCalc: React.FC<FuturesCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [symbol, setSymbol] = useState('NQ');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [contracts, setContracts] = useState('1');
  const [entryPrice, setEntryPrice] = useState('18000');
  const [exitPrice, setExitPrice] = useState('18100');
  const [commission, setCommission] = useState('2.50');

  // Specs
  const [tickSize, setTickSize] = useState('0.25');
  const [tickValue, setTickValue] = useState('5.0');
  const [multiplier, setMultiplier] = useState('20');

  useEffect(() => {
    if (symbol === 'ES') {
      setTickSize('0.25'); setTickValue('12.5'); setMultiplier('50');
    } else if (symbol === 'MES') {
      setTickSize('0.25'); setTickValue('1.25'); setMultiplier('5');
    } else if (symbol === 'NQ') {
      setTickSize('0.25'); setTickValue('5.0'); setMultiplier('20');
    } else if (symbol === 'MNQ') {
      setTickSize('0.25'); setTickValue('0.5'); setMultiplier('2');
    } else if (symbol === 'CL') {
      setTickSize('0.01'); setTickValue('10.0'); setMultiplier('1000');
    } else if (symbol === 'GC') {
      setTickSize('0.10'); setTickValue('10.0'); setMultiplier('100');
    }
  }, [symbol]);

  const handleReset = () => {
    setSymbol('NQ');
    setDirection('BUY');
    setContracts('1');
    setEntryPrice('18000');
    setExitPrice('18100');
    setCommission('2.50');
  };

  const cCount = parseFloat(contracts) || 1;
  const ent = parseFloat(entryPrice) || 0;
  const ex = parseFloat(exitPrice) || 0;
  const tSize = parseFloat(tickSize) || 0.25;
  const tVal = parseFloat(tickValue) || 5.00;
  const mult = parseFloat(multiplier) || 20;
  const comm = parseFloat(commission) || 0;

  const pointsDiff = direction === 'BUY' ? ex - ent : ent - ex;
  const ticksCount = pointsDiff / tSize;
  
  const grossPnl = ticksCount * tVal * cCount;
  const totalCommission = comm * cCount * 2; // Two-way roundtrip
  const netPnl = grossPnl - totalCommission;

  const notionalValue = ent * mult * cCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Futures Spec Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-xs text-slate-400 mb-1 block">Direction</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDirection('BUY')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    direction === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Long
                </button>
                <button
                  onClick={() => setDirection('SELL')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    direction === 'SELL' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Number of Contracts</label>
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Commission (Roundtrip / contract)</label>
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Entry Price</label>
              <input
                type="number"
                step="0.25"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Exit Price</label>
              <input
                type="number"
                step="0.25"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">PnL & Exposure Outputs</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Net P&L</span>
              <div className={`text-2xl font-black mt-1 font-mono ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPnl >= 0 ? `+${formatCurrency(netPnl)}` : formatCurrency(netPnl)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Notional Exposure</span>
              <div className="text-xl font-bold text-indigo-400 mt-1 font-mono">
                {formatCurrency(notionalValue)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Points Captured</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {pointsDiff >= 0 ? `+${pointsDiff.toFixed(2)}` : pointsDiff.toFixed(2)} pts
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Ticks Captured</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {ticksCount >= 0 ? `+${ticksCount.toFixed(1)}` : ticksCount.toFixed(1)} ticks
              </div>
            </div>
          </div>

          {/* Educational panel */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              Notional vs. Real Risk
            </span>
            <p>
              Futures contracts are highly leveraged instruments. While buying 1 contract of NQ at $18,000 has a notional value of <strong>{formatCurrency(18000 * 20)}</strong>, your actual financial risk is governed exclusively by your stop-loss distance and tick value ($5.00 per 0.25 tick).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
