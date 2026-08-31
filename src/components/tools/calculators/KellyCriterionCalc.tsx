import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, Compass } from 'lucide-react';

interface KellyCriterionCalcProps {
  onClose: () => void;
}

export const KellyCriterionCalc: React.FC<KellyCriterionCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [balance, setBalance] = useState('50000');
  const [winRate, setWinRate] = useState('55');
  const [rewardToRisk, setRewardToRisk] = useState('1.5');
  const [fractionValue, setFractionValue] = useState('0.5'); // Half Kelly is default in institutional prop desks

  const balVal = parseFloat(balance) || 0;
  const p = (parseFloat(winRate) || 0) / 100;
  const b = parseFloat(rewardToRisk) || 0;
  const fraction = parseFloat(fractionValue) || 0.5;

  const q = 1 - p;
  
  // Kelly Formula: f* = p - (q / b)
  let kellyFraction = 0;
  if (b > 0) {
    kellyFraction = p - (q / b);
  }
  
  const rawKellyPercent = kellyFraction * 100;
  const adjustedKellyPercent = rawKellyPercent * fraction;
  
  const isKellyNegative = kellyFraction <= 0;
  const recommendedRiskDollars = Math.max(0, balVal * (adjustedKellyPercent / 100));

  const handleReset = () => {
    setBalance('50000');
    setWinRate('55');
    setRewardToRisk('1.5');
    setFractionValue('0.5');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kelly Formula Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Balance ($)</label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Win Rate (%)</label>
                <input
                  type="number"
                  value={winRate}
                  onChange={(e) => setWinRate(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reward/Risk Ratio (b)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rewardToRisk}
                  onChange={(e) => setRewardToRisk(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Fractional Kelly Sizing</label>
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFractionValue('1.0')}
                  className={`py-1.5 text-[10px] font-bold rounded transition ${
                    fractionValue === '1.0' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Full (1.0)
                </button>
                <button
                  onClick={() => setFractionValue('0.5')}
                  className={`py-1.5 text-[10px] font-bold rounded transition ${
                    fractionValue === '0.5' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Half (0.5)
                </button>
                <button
                  onClick={() => setFractionValue('0.25')}
                  className={`py-1.5 text-[10px] font-bold rounded transition ${
                    fractionValue === '0.25' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Quarter (0.25)
                </button>
                <button
                  onClick={() => setFractionValue('0.1')}
                  className={`py-1.5 text-[10px] font-bold rounded transition ${
                    fractionValue === '0.1' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Safe (0.1)
                </button>
              </div>
            </div>
          </div>

          {isKellyNegative && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-400 leading-relaxed">
              <strong>Negative Expectancy:</strong> Standard Kelly fraction is negative. This means trading with these conditions has negative expectancy, and you should not trade.
            </div>
          )}
        </div>

        {/* Right: Results Panel */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sizing Optimization Results</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Full Kelly Fraction</span>
              <div className={`text-2xl font-black mt-1 font-mono ${isKellyNegative ? 'text-rose-500' : 'text-indigo-400'}`}>
                {isKellyNegative ? '0.00%' : `${rawKellyPercent.toFixed(2)}%`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Adjusted Kelly Risk</span>
              <div className={`text-2xl font-black mt-1 font-mono ${isKellyNegative ? 'text-rose-500' : 'text-emerald-400'}`}>
                {isKellyNegative ? '0.00%' : `${adjustedKellyPercent.toFixed(2)}%`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Recommended Risk Dollars</span>
              <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                {formatCurrency(recommendedRiskDollars)}
              </div>
            </div>
          </div>

          {/* Theory / Insights Panel */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Institutional Sizing Insights
            </span>
            <p>
              The <strong>Kelly Criterion</strong> defines the mathematically optimal stake to maximize logarithmic wealth growth. However, Full Kelly risk can lead to extreme swings and potential ruin due to variance in trading. Professional quantitative desks typically limit risk to <strong>Half Kelly (0.5)</strong> or <strong>Quarter Kelly (0.25)</strong> to preserve capital while maintaining mathematical edge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
