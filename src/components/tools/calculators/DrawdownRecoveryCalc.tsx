import React, { useState, useEffect, useMemo } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface DrawdownRecoveryCalcProps {
  onClose: () => void;
}

export const DrawdownRecoveryCalc: React.FC<DrawdownRecoveryCalcProps> = ({ onClose }) => {
  const { accounts, selectedAccountId, formatCurrency } = useTrading();

  // Find active account to prefill balance
  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const initialBalance = activeAccount ? activeAccount.currentBalance.toString() : '50000';

  // State Inputs
  const [startBalance, setStartBalance] = useState(initialBalance);
  const [drawdownPercent, setDrawdownPercent] = useState('15');
  const [avgRiskPerTrade, setAvgRiskPerTrade] = useState('1.0');
  const [winRate, setWinRate] = useState('50');
  const [rewardToRisk, setRewardToRisk] = useState('2.0');

  // Derive Current Balance when Start Balance or Drawdown changes
  const [currentBalance, setCurrentBalance] = useState('');

  useEffect(() => {
    const sb = parseFloat(startBalance) || 0;
    const dp = parseFloat(drawdownPercent) || 0;
    setCurrentBalance((sb * (1 - dp / 100)).toFixed(2));
  }, [startBalance, drawdownPercent]);

  const handleCurrentBalanceChange = (val: string) => {
    setCurrentBalance(val);
    const sb = parseFloat(startBalance) || 0;
    const cb = parseFloat(val) || 0;
    if (sb > 0 && cb <= sb) {
      setDrawdownPercent(((1 - cb / sb) * 100).toFixed(2));
    }
  };

  const handleStartBalanceChange = (val: string) => {
    setStartBalance(val);
    const sb = parseFloat(val) || 0;
    const dp = parseFloat(drawdownPercent) || 0;
    setCurrentBalance((sb * (1 - dp / 100)).toFixed(2));
  };

  // Calculations
  const sbVal = parseFloat(startBalance) || 0;
  const dpVal = parseFloat(drawdownPercent) || 0;
  const cbVal = parseFloat(currentBalance) || 0;
  const riskVal = parseFloat(avgRiskPerTrade) || 1.0;
  const wrVal = (parseFloat(winRate) || 50) / 100;
  const rrVal = parseFloat(rewardToRisk) || 2.0;

  const isValid = sbVal > 0 && dpVal >= 0 && cbVal > 0 && cbVal <= sbVal;

  const currentDrawdownDollars = isValid ? sbVal - cbVal : 0;
  const requiredRecoveryPercent = isValid && cbVal > 0 ? ((sbVal - cbVal) / cbVal) * 100 : 0;
  
  // Calculate expectancy of recovery program
  // Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
  // Here Avg Loss = riskVal % of CB, Avg Win = riskVal * rrVal % of CB
  const riskDollarsPerTrade = cbVal * (riskVal / 100);
  const winDollarsPerTrade = riskDollarsPerTrade * rrVal;
  const expectancyDollars = (wrVal * winDollarsPerTrade) - ((1 - wrVal) * riskDollarsPerTrade);

  const estimatedTradesRequired = isValid && expectancyDollars > 0 
    ? Math.ceil(currentDrawdownDollars / expectancyDollars) 
    : 0;

  const handleReset = () => {
    setStartBalance(initialBalance);
    setDrawdownPercent('15');
    setAvgRiskPerTrade('1.0');
    setWinRate('50');
    setRewardToRisk('2.0');
  };

  // Standard recovery metrics table lookup
  const standards = [
    { loss: 5, recovery: 5.26 },
    { loss: 10, recovery: 11.11 },
    { loss: 20, recovery: 25.0 },
    { loss: 30, recovery: 42.86 },
    { loss: 40, recovery: 66.67 },
    { loss: 50, recovery: 100.0 },
    { loss: 60, recovery: 150.0 },
    { loss: 70, recovery: 233.33 },
    { loss: 80, recovery: 400.0 },
    { loss: 90, recovery: 900.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Inputs vs Main Output metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Calculator Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Starting Balance ($)</label>
              <input
                type="number"
                value={startBalance}
                onChange={(e) => handleStartBalanceChange(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Drawdown (%)</label>
              <input
                type="number"
                step="0.5"
                value={drawdownPercent}
                onChange={(e) => setDrawdownPercent(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Current Balance ($)</label>
              <input
                type="number"
                value={currentBalance}
                onChange={(e) => handleCurrentBalanceChange(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Avg Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={avgRiskPerTrade}
                onChange={(e) => setAvgRiskPerTrade(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expected Win Rate (%)</label>
              <input
                type="number"
                step="1"
                value={winRate}
                onChange={(e) => setWinRate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Reward/Risk Ratio (R)</label>
              <input
                type="number"
                step="0.1"
                value={rewardToRisk}
                onChange={(e) => setRewardToRisk(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {!isValid && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-400">
              <strong>Validation Alert:</strong> Please ensure starting balance is positive and greater than or equal to current balance.
            </div>
          )}
        </div>

        {/* Right: Results Panel */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Recovery Metrics</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Current Drawdown</span>
              <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
                {formatCurrency(currentDrawdownDollars)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Required Recovery</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">
                {requiredRecoveryPercent.toFixed(2)}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Expectancy Per Trade</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {expectancyDollars > 0 ? `+${formatCurrency(expectancyDollars)}` : formatCurrency(expectancyDollars)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Est. Trades Required</span>
              <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                {expectancyDollars > 0 ? `${estimatedTradesRequired} Trades` : 'Infinity (Negative Expectancy)'}
              </div>
            </div>
          </div>

          {/* Mathematical explanation block */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              The Math of Break-Even Symmetries
            </span>
            <p>
              Drawdown is calculated on your peak capital, whereas the recovery is calculated on your remaining, smaller balance. This creates a non-linear relationship: a loss of <strong>10%</strong> needs <strong>11.11%</strong> to recover, whereas a loss of <strong>50%</strong> needs a full <strong>100.0%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios Table */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Reference Matrix</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {standards.map((s, idx) => {
            const isActive = Math.abs(dpVal - s.loss) < 5;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition ${
                  isActive 
                    ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md' 
                    : 'bg-slate-900 border-slate-800/80'
                }`}
              >
                <div className="text-xs text-rose-400 font-bold">-{s.loss}% Loss</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Needs</div>
                <div className="text-xs font-black text-emerald-400 mt-1 font-mono">+{s.recovery.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
