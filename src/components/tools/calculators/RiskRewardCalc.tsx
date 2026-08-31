import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, BarChart2 } from 'lucide-react';

interface RiskRewardCalcProps {
  onClose: () => void;
}

export const RiskRewardCalc: React.FC<RiskRewardCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [entryPrice, setEntryPrice] = useState('100');
  const [stopLoss, setStopLoss] = useState('95');
  const [shares, setShares] = useState('100');

  // Multi-target Scaling state
  const [tp1Price, setTp1Price] = useState('110');
  const [tp1Percent, setTp1Percent] = useState('50'); // scale out 50% here
  const [tp2Price, setTp2Price] = useState('120');
  const [tp2Percent, setTp2Percent] = useState('50'); // scale out remaining 50%

  const handleReset = () => {
    setEntryPrice('100');
    setStopLoss('95');
    setShares('100');
    setTp1Price('110');
    setTp1Percent('50');
    setTp2Price('120');
    setTp2Percent('50');
  };

  const ent = parseFloat(entryPrice) || 100;
  const sl = parseFloat(stopLoss) || 95;
  const qty = parseFloat(shares) || 100;

  const tp1P = parseFloat(tp1Price) || 110;
  const tp1Pct = (parseFloat(tp1Percent) || 50) / 100;
  const tp2P = parseFloat(tp2Price) || 120;
  const tp2Pct = (parseFloat(tp2Percent) || 50) / 100;

  // Blended Take Profit Exit Price calculation
  // (TP1 * TP1%) + (TP2 * TP2%)
  const totalScalePct = tp1Pct + tp2Pct;
  const blendedTp = totalScalePct > 0 
    ? (tp1P * tp1Pct + tp2P * tp2Pct) / totalScalePct
    : tp1P;

  const stopDistance = Math.abs(ent - sl);
  const rewardDistance = Math.abs(blendedTp - ent);

  const riskAmount = stopDistance * qty;
  const rewardAmount = rewardDistance * qty;

  const rewardRiskRatio = stopDistance > 0 ? rewardDistance / stopDistance : 0;

  // Breakeven Win Rate formula: 1 / (1 + RewardRiskRatio)
  const breakevenWinRate = rewardRiskRatio > 0 ? (1 / (1 + rewardRiskRatio)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Risk Parameters</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="text-xs text-slate-400 mb-1 block">Entry Price ($)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-3">
              <label className="text-xs text-slate-400 mb-1 block">Stop Loss ($)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-3">
              <label className="text-xs text-slate-400 mb-1 block font-mono">Shares / Contracts size</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target 1 Scale Out */}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Take Profit 1 ($)</label>
              <input
                type="number"
                value={tp1Price}
                onChange={(e) => setTp1Price(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Scale %</label>
              <input
                type="number"
                value={tp1Percent}
                onChange={(e) => setTp1Percent(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target 2 Scale Out */}
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Take Profit 2 ($)</label>
              <input
                type="number"
                value={tp2Price}
                onChange={(e) => setTp2Price(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block font-mono">Scale %</label>
              <input
                type="number"
                value={tp2Percent}
                onChange={(e) => setTp2Percent(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary panels */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Statistical Outputs</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Blended Take-Profit</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                ${blendedTp.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Blended R-Multiple</span>
              <div className="text-xl font-black text-indigo-400 mt-1 font-mono">
                {rewardRiskRatio.toFixed(2)}R
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Total Amount Risked</span>
              <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                {formatCurrency(riskAmount)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Blended Profit Goal</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {formatCurrency(rewardAmount)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Required Win Rate to Break-Even</span>
              <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                {breakevenWinRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Sizing description / educational insight */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              The Symmetries of Probability & R
            </span>
            <p>
              In professional trading, your win rate is only half the equation. Under a <strong>2.0R</strong> reward-risk profile, you only need to win <strong>33.3%</strong> of your trades to completely break-even. Scaling out at multiple targets locks in gains but alters your net blended R-multiple.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
