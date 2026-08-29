import React, { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Target,
  Layers,
  ArrowUpRight,
  Info,
  Calendar
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  calculatePositionSize,
  calculateCompoundingProjection,
  AssetClass,
  formatRValue
} from '../../lib/calcEngine';

export const TradingToolsView: React.FC = () => {
  const { formatCurrency } = useTrading();

  // Position Size State
  const [assetClass, setAssetClass] = useState<AssetClass>('FUTURES');
  const [accountSize, setAccountSize] = useState('50000');
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'DOLLARS'>('PERCENT');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [riskDollars, setRiskDollars] = useState('500');
  const [entryPrice, setEntryPrice] = useState('20000');
  const [stopLossPrice, setStopLossPrice] = useState('19980');
  const [takeProfitPrice, setTakeProfitPrice] = useState('20060');
  const [futuresSymbol, setFuturesSymbol] = useState<'NQ' | 'ES' | 'MNQ' | 'MES'>('NQ');

  // Compounding Calculator State
  const [startCapital, setStartCapital] = useState('25000');
  const [monthlyGain, setMonthlyGain] = useState('5.0');
  const [monthsCount, setMonthsCount] = useState('12');
  const [monthlyContribution, setMonthlyContribution] = useState('0');

  // Calculate Futures preset specs
  const futuresSpecs = useMemo(() => {
    switch (futuresSymbol) {
      case 'ES':
        return { tickSize: 0.25, tickValue: 12.5, contractMultiplier: 50 };
      case 'MES':
        return { tickSize: 0.25, tickValue: 1.25, contractMultiplier: 5 };
      case 'MNQ':
        return { tickSize: 0.25, tickValue: 0.5, contractMultiplier: 2 };
      case 'NQ':
      default:
        return { tickSize: 0.25, tickValue: 5.0, contractMultiplier: 20 };
    }
  }, [futuresSymbol]);

  // Compute Position Sizing
  const sizingResult = useMemo(() => {
    const balance = parseFloat(accountSize) || 50000;
    const entry = parseFloat(entryPrice) || 0;
    const stop = parseFloat(stopLossPrice) || 0;
    const tp = parseFloat(takeProfitPrice) || undefined;

    return calculatePositionSize({
      assetClass,
      accountBalance: balance,
      riskPercent: riskMode === 'PERCENT' ? parseFloat(riskPercent) || 1.0 : undefined,
      riskDollars: riskMode === 'DOLLARS' ? parseFloat(riskDollars) || 500 : undefined,
      entryPrice: entry,
      stopLossPrice: stop,
      takeProfitPrice: tp,
      futuresTickSize: futuresSpecs.tickSize,
      futuresTickValue: futuresSpecs.tickValue,
      futuresContractMultiplier: futuresSpecs.contractMultiplier,
      forexPipSize: 0.0001,
      forexPipValuePerStandardLot: 10.0,
    });
  }, [
    assetClass,
    accountSize,
    riskMode,
    riskPercent,
    riskDollars,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    futuresSpecs,
  ]);

  // Compute Compounding Projection
  const compoundingResult = useMemo(() => {
    const start = parseFloat(startCapital) || 25000;
    const gain = parseFloat(monthlyGain) || 5.0;
    const months = parseInt(monthsCount) || 12;
    const contrib = parseFloat(monthlyContribution) || 0;

    return calculateCompoundingProjection(start, gain, months, contrib);
  }, [startCapital, monthlyGain, monthsCount, monthlyContribution]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-400" />
            Institutional Trading Mathematics & Sizing Tools
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Precision mathematical models for futures contract sizing, risk:reward geometry, and portfolio compounding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Position Size & Risk Calculator */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Position Sizing & Risk Engine
            </h3>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(['FUTURES', 'FOREX', 'STOCKS', 'CRYPTO'] as AssetClass[]).map((ac) => (
                <button
                  key={ac}
                  onClick={() => setAssetClass(ac)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                    assetClass === ac ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ac}
                </button>
              ))}
            </div>
          </div>

          {/* Sizing Input Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Balance ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {assetClass === 'FUTURES' ? (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Contract Type</label>
                <select
                  value={futuresSymbol}
                  onChange={(e) => setFuturesSymbol(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="NQ">E-mini NQ ($20/pt, $5/tick)</option>
                  <option value="MNQ">Micro NQ ($2/pt, $0.50/tick)</option>
                  <option value="ES">E-mini ES ($50/pt, $12.50/tick)</option>
                  <option value="MES">Micro ES ($5/pt, $1.25/tick)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Risk Calculation Mode</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setRiskMode('PERCENT')}
                    className={`py-1 text-[11px] font-bold rounded ${
                      riskMode === 'PERCENT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Percent (%)
                  </button>
                  <button
                    onClick={() => setRiskMode('DOLLARS')}
                    className={`py-1 text-[11px] font-bold rounded ${
                      riskMode === 'DOLLARS' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Cash ($)
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                {riskMode === 'PERCENT' ? 'Risk Per Trade (%)' : 'Risk Amount ($)'}
              </label>
              {riskMode === 'PERCENT' ? (
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <input
                  type="number"
                  step="50"
                  value={riskDollars}
                  onChange={(e) => setRiskDollars(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Entry Price</label>
              <input
                type="number"
                step="0.25"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Stop Loss Price</label>
              <input
                type="number"
                step="0.25"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Take Profit Price (Optional)</label>
              <input
                type="number"
                step="0.25"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Sizing Output Result */}
          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Calculated Position Size:</span>
              <div className="text-2xl font-black font-mono text-indigo-400">
                {sizingResult.positionUnits}{' '}
                <span className="text-xs font-medium text-slate-400">
                  {assetClass === 'FUTURES'
                    ? 'Contracts'
                    : assetClass === 'FOREX'
                    ? 'Standard Lots'
                    : 'Shares / Units'}
                </span>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
              <div>
                Calculated Risk: <strong className="text-rose-400">${(sizingResult.riskAmount ?? 0).toFixed(2)}</strong> ({sizingResult.riskPercentOfAccount}%)
              </div>
              <div>
                Stop Distance: <strong>{sizingResult.stopLossDistance} pts</strong> ({sizingResult.stopLossTicksOrPips} ticks/pips)
              </div>
              {sizingResult.riskRewardRatio && (
                <div>
                  Planned R:R: <strong className="text-emerald-400">{sizingResult.riskRewardRatio}:1</strong> ({formatRValue(sizingResult.rMultiple)})
                </div>
              )}
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
              PRECISION MATH
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Starting Balance ($)</label>
              <input
                type="number"
                value={startCapital}
                onChange={(e) => setStartCapital(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Monthly Return (%)</label>
              <input
                type="number"
                step="0.5"
                value={monthlyGain}
                onChange={(e) => setMonthlyGain(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Months</label>
              <input
                type="number"
                value={monthsCount}
                onChange={(e) => setMonthsCount(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Monthly Addition ($)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Compounding Output Result */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Projected Portfolio Value:</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {formatCurrency(compoundingResult.finalBalance)}
              </div>
            </div>
            <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
              <div>
                Total Net Gain: <strong className="text-emerald-400">+{(compoundingResult.totalGrowthPercent ?? 0).toFixed(1)}%</strong>
              </div>
              <div>
                Realized Profit: <strong className="text-slate-100">{formatCurrency(compoundingResult.totalNetProfit)}</strong>
              </div>
              {compoundingResult.totalContributions > 0 && (
                <div>
                  Deposits: <strong>{formatCurrency(compoundingResult.totalContributions)}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
