import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, Medal } from 'lucide-react';

interface PropFirmRoiCalcProps {
  onClose: () => void;
}

export const PropFirmRoiCalc: React.FC<PropFirmRoiCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [accountSize, setAccountSize] = useState('100000');
  const [evaluationFee, setEvaluationFee] = useState('500');
  const [profitSplit, setProfitSplit] = useState('80');
  const [expectedGainPercent, setExpectedGainPercent] = useState('5.0');
  const [monthsHeld, setMonthsHeld] = useState('3');
  const [refundableFee, setRefundableFee] = useState<boolean>(true);

  const handleReset = () => {
    setAccountSize('100000');
    setEvaluationFee('500');
    setProfitSplit('80');
    setExpectedGainPercent('5.0');
    setMonthsHeld('3');
    setRefundableFee(true);
  };

  const capSize = parseFloat(accountSize) || 100000;
  const feePaid = parseFloat(evaluationFee) || 500;
  const splitPct = (parseFloat(profitSplit) || 80) / 100;
  const gainPct = (parseFloat(expectedGainPercent) || 5.0) / 100;
  const months = parseFloat(monthsHeld) || 3;

  // Calculations
  const monthlyProfit = capSize * gainPct;
  const totalProfit = monthlyProfit * months;
  const traderShare = totalProfit * splitPct;
  const refundAmount = refundableFee ? feePaid : 0;
  const netEarnings = traderShare + refundAmount - feePaid;
  
  // ROI on risk capital (the evaluation fee)
  const propFirmRoi = feePaid > 0 ? (netEarnings / feePaid) * 100 : 0;

  // Comparison with raw trading
  // If you traded the evaluation fee amount ($500) directly with the same gain %
  const rawTradingProfit = feePaid * Math.pow(1 + gainPct, months) - feePaid;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prop Sizing Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Size ($)</label>
              <select
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="10000">10,000 (Micro)</option>
                <option value="25000">25,000 (Starter)</option>
                <option value="50000">50,000 (Standard)</option>
                <option value="100000">100,000 (Advanced)</option>
                <option value="200000">200,000 (Master)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Evaluation Fee ($)</label>
              <input
                type="number"
                value={evaluationFee}
                onChange={(e) => setEvaluationFee(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expected Gain / Month (%)</label>
              <input
                type="number"
                step="0.5"
                value={expectedGainPercent}
                onChange={(e) => setExpectedGainPercent(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block font-mono">Profit Split (%)</label>
              <input
                type="number"
                value={profitSplit}
                onChange={(e) => setProfitSplit(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Months Held</label>
              <input
                type="number"
                value={monthsHeld}
                onChange={(e) => setMonthsHeld(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block">Refund Policy</label>
              <label className="flex items-center gap-2 cursor-pointer pt-1.5">
                <input
                  type="checkbox"
                  checked={refundableFee}
                  onChange={(e) => setRefundableFee(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300">100% Refundable</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Summary ROI Panels */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">ROI Sizing Outputs</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Total Profit Generated</span>
              <div className="text-xl font-black text-slate-100 mt-1 font-mono">
                {formatCurrency(totalProfit)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Trader's Split Share</span>
              <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                {formatCurrency(traderShare)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Net Earnings After Fee</span>
              <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                {formatCurrency(netEarnings)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Prop Leverage ROI %</span>
              <div className="text-xl font-black text-indigo-400 mt-1 font-mono">
                {propFirmRoi.toLocaleString()}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Own Capital ROI</span>
              <div className="text-lg font-bold text-slate-400 mt-1 font-mono">
                {(gainPct * 100 * months).toFixed(1)}% ({formatCurrency(rawTradingProfit)})
              </div>
            </div>
          </div>

          {/* Sizing description / educational insight */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-indigo-400" />
              The Leverage of Prop Desks
            </span>
            <p>
              By paying an evaluation fee of <strong>{formatCurrency(feePaid)}</strong>, you gain trading access to <strong>{formatCurrency(capSize)}</strong> of purchasing power. The ROI is magnified because your risk exposure is capped exclusively at the evaluation fee while harvesting up to {profitSplit}% of gains.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
