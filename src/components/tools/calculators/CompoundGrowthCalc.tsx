import React, { useState, useMemo } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface CompoundGrowthCalcProps {
  onClose: () => void;
}

export const CompoundGrowthCalc: React.FC<CompoundGrowthCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [startingBalance, setStartingBalance] = useState('10000');
  const [monthlyContribution, setMonthlyContribution] = useState('500');
  const [interestRate, setInterestRate] = useState('8.0'); // annual or monthly gain %
  const [durationYears, setDurationYears] = useState('10');
  const [rateMode, setRateMode] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');

  const handleReset = () => {
    setStartingBalance('10000');
    setMonthlyContribution('500');
    setInterestRate('8.0');
    setDurationYears('10');
    setRateMode('ANNUAL');
  };

  const startVal = parseFloat(startingBalance) || 10000;
  const contribVal = parseFloat(monthlyContribution) || 500;
  const rawRate = parseFloat(interestRate) || 8.0;
  const years = parseFloat(durationYears) || 10;

  // Monthly breakdown calculation
  const compoundingResults = useMemo(() => {
    const totalMonths = Math.floor(years * 12);
    const monthlyRate = rateMode === 'ANNUAL' ? (rawRate / 100) / 12 : rawRate / 100;

    const breakdown: { month: number; start: number; gain: number; end: number; invested: number }[] = [];
    let currentBalance = startVal;
    let totalInvested = startVal;

    for (let m = 1; m <= totalMonths; m++) {
      const start = currentBalance;
      const gain = start * monthlyRate;
      currentBalance = start + gain + contribVal;
      totalInvested += contribVal;

      breakdown.push({
        month: m,
        start,
        gain,
        end: currentBalance,
        invested: totalInvested,
      });
    }

    return breakdown;
  }, [startVal, contribVal, rawRate, years, rateMode]);

  const finalBreakdown = compoundingResults;
  const finalBalance = finalBreakdown.length > 0 ? finalBreakdown[finalBreakdown.length - 1].end : startVal;
  const totalPrincipalInvested = finalBreakdown.length > 0 ? finalBreakdown[finalBreakdown.length - 1].invested : startVal;
  const totalInterestEarned = finalBalance - totalPrincipalInvested;

  // Chart plotting logic
  const svgChartComp = useMemo(() => {
    if (finalBreakdown.length === 0) return null;

    const width = 600;
    const height = 200;
    const padding = 20;

    const maxVal = finalBalance * 1.05;
    const xStep = (width - padding * 2) / finalBreakdown.length;
    const yScale = (height - padding * 2) / maxVal;

    // Line points for balance
    const balancePoints = finalBreakdown
      .map((item, idx) => {
        const x = padding + idx * xStep;
        const y = height - padding - item.end * yScale;
        return `${x},${y}`;
      })
      .join(' ');

    // Line points for principal invested
    const principalPoints = finalBreakdown
      .map((item, idx) => {
        const x = padding + idx * xStep;
        const y = height - padding - item.invested * yScale;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => {
          const yVal = maxVal * ratio;
          const yPos = height - padding - yVal * yScale;
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={yPos}
                x2={width - padding}
                y2={yPos}
                stroke="#1E293B"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding + 5}
                y={yPos - 4}
                fill="#64748B"
                fontSize="8"
                fontFamily="monospace"
              >
                {formatCurrency(yVal)}
              </text>
            </g>
          );
        })}

        {/* Areas or Lines */}
        <polyline
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          points={principalPoints}
        />
        <polyline
          fill="none"
          stroke="#6366F1"
          strokeWidth="2.5"
          points={balancePoints}
        />
      </svg>
    );
  }, [finalBreakdown, finalBalance, formatCurrency]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Parameters</h4>
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
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Monthly Contribution ($)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Interest / Return Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Rate Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setRateMode('ANNUAL')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    rateMode === 'ANNUAL' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Annual (APR)
                </button>
                <button
                  onClick={() => setRateMode('MONTHLY')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    rateMode === 'MONTHLY' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Compounding Horizon (Years)</label>
              <input
                type="number"
                value={durationYears}
                onChange={(e) => setDurationYears(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary ROI Panels */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Future Wealth Forecast</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Forecasted Net Balance</span>
              <div className="text-3xl font-black text-emerald-400 mt-1 font-mono">
                {formatCurrency(finalBalance)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide font-mono">Total Capital Invested</span>
              <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                {formatCurrency(totalPrincipalInvested)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Compounded Earnings</span>
              <div className="text-lg font-bold text-indigo-400 mt-1 font-mono">
                {formatCurrency(totalInterestEarned)}
              </div>
            </div>
          </div>

          {/* Sizing description / educational insight */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Exponential Compound Curves
            </span>
            <p>
              In compounding growth simulations, time and consistencies are your greatest amplifiers. The blue curve illustrates your total net asset value, whereas the dashed grey line represents your flat raw cash contributions. The wedge between them is the leverage of compounded growth.
            </p>
          </div>
        </div>
      </div>

      {/* SVG chart curve */}
      {finalBreakdown.length > 0 && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Compounding Asset Path Projection</h4>
          <div className="w-full h-[200px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800/60 relative">
            {svgChartComp}
          </div>
        </div>
      )}
    </div>
  );
};
