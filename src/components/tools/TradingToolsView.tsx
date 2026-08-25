import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const TradingToolsView: React.FC = () => {
  const { formatCurrency } = useTrading();

  // Position Size State
  const [accountSize, setAccountSize] = useState('50000');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [stopLossTicks, setStopLossTicks] = useState('10');
  const [pointValue, setPointValue] = useState('5'); // MES = $5 per pt ($1.25 per tick)

  // Compounding Calculator State
  const [startCapital, setStartCapital] = useState('10000');
  const [monthlyGain, setMonthlyGain] = useState('8.0');
  const [monthsCount, setMonthsCount] = useState('12');

  // Computed Position Size
  const accNum = parseFloat(accountSize) || 50000;
  const riskPctNum = parseFloat(riskPercent) || 1.0;
  const maxDollarRisk = (accNum * riskPctNum) / 100;
  const riskPerContract = (parseFloat(stopLossTicks) || 10) * (parseFloat(pointValue) || 5);
  const calculatedContracts = riskPerContract > 0 ? Math.floor(maxDollarRisk / riskPerContract) : 1;

  // Computed Compounding
  const compStart = parseFloat(startCapital) || 10000;
  const compGain = parseFloat(monthlyGain) || 8.0;
  const compMonths = parseInt(monthsCount) || 12;
  const finalCompounded = compStart * Math.pow(1 + compGain / 100, compMonths);
  const totalGrowthPct = ((finalCompounded - compStart) / compStart) * 100;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-400" />
            Institutional Trading Calculators
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Precise risk sizing, pip values, compounding projections, and market session timeframes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Position Size & Risk Calculator */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Position Sizing & Contract Calculator
            </h3>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
              RISK CAP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Equity ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={e => setAccountSize(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={e => setRiskPercent(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Stop Loss Distance (Points)</label>
              <input
                type="number"
                value={stopLossTicks}
                onChange={e => setStopLossTicks(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Point Multiplier ($/pt)</label>
              <select
                value={pointValue}
                onChange={e => setPointValue(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="5">Micro E-mini MES ($5/pt)</option>
                <option value="50">E-mini ES ($50/pt)</option>
                <option value="20">E-mini NQ ($20/pt)</option>
                <option value="2">Micro NQ MNQ ($2/pt)</option>
                <option value="10">Forex 1 Standard Lot ($10/pip)</option>
              </select>
            </div>
          </div>

          {/* Sizing Output Result */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Allowed Position Size:</span>
              <div className="text-2xl font-black font-mono text-indigo-400">
                {calculatedContracts} <span className="text-sm font-normal text-slate-400">Contracts / Lots</span>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              <div>Total Risk: <strong className="text-rose-400">${maxDollarRisk.toFixed(2)}</strong></div>
              <div>Per Contract: <strong>${riskPerContract.toFixed(2)}</strong></div>
            </div>
          </div>
        </div>

        {/* Tool 2: Long-Term Compounding Growth Projection */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Compounding Alpha Growth Simulator
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
              ALPHA COMPOUND
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Starting Balance ($)</label>
              <input
                type="number"
                value={startCapital}
                onChange={e => setStartCapital(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Monthly Return (%)</label>
              <input
                type="number"
                step="0.5"
                value={monthlyGain}
                onChange={e => setMonthlyGain(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Timeframe (Months)</label>
              <input
                type="number"
                value={monthsCount}
                onChange={e => setMonthsCount(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Compounding Output Result */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Projected Portfolio Value:</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(finalCompounded)}
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              <div>Total Growth: <strong className="text-emerald-400">+{totalGrowthPct.toFixed(1)}%</strong></div>
              <div>Net Realized Profit: <strong>{formatCurrency(finalCompounded - compStart)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
