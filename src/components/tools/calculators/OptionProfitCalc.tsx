import React, { useState, useMemo } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface OptionProfitCalcProps {
  onClose: () => void;
}

export const OptionProfitCalc: React.FC<OptionProfitCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [underlyingPrice, setUnderlyingPrice] = useState('100');
  const [strikePrice, setStrikePrice] = useState('100');
  const [premium, setPremium] = useState('3.50');
  const [contracts, setContracts] = useState('1');
  const [targetUnderlying, setTargetUnderlying] = useState('110');

  const undVal = parseFloat(underlyingPrice) || 100;
  const strikeVal = parseFloat(strikePrice) || 100;
  const premVal = parseFloat(premium) || 3.5;
  const contrVal = parseFloat(contracts) || 1;
  const tgtVal = parseFloat(targetUnderlying) || 110;

  const sharesMultiplier = 100;
  const totalShares = contrVal * sharesMultiplier;
  const costBasis = premVal * totalShares;

  // Derivations
  const maxLoss = useMemo(() => {
    if (positionType === 'LONG') {
      return costBasis;
    } else {
      if (optionType === 'CALL') {
        return Infinity; // Unlimited risk
      } else {
        return strikeVal * totalShares - costBasis; // Stock goes to zero
      }
    }
  }, [positionType, optionType, strikeVal, totalShares, costBasis]);

  const maxProfit = useMemo(() => {
    if (positionType === 'LONG') {
      if (optionType === 'CALL') {
        return Infinity;
      } else {
        return strikeVal * totalShares - costBasis;
      }
    } else {
      return costBasis;
    }
  }, [positionType, optionType, strikeVal, totalShares, costBasis]);

  const breakEven = useMemo(() => {
    if (optionType === 'CALL') {
      return strikeVal + premVal;
    } else {
      return strikeVal - premVal;
    }
  }, [optionType, strikeVal, premVal]);

  const calculatePnlAtPrice = (price: number) => {
    let pnlPerShare = 0;
    if (optionType === 'CALL') {
      const intrinsic = Math.max(0, price - strikeVal);
      pnlPerShare = positionType === 'LONG' ? intrinsic - premVal : premVal - intrinsic;
    } else {
      const intrinsic = Math.max(0, strikeVal - price);
      pnlPerShare = positionType === 'LONG' ? intrinsic - premVal : premVal - intrinsic;
    }
    return pnlPerShare * totalShares;
  };

  const targetPnl = calculatePnlAtPrice(tgtVal);

  const handleReset = () => {
    setOptionType('CALL');
    setPositionType('LONG');
    setUnderlyingPrice('100');
    setStrikePrice('100');
    setPremium('3.50');
    setContracts('1');
    setTargetUnderlying('110');
  };

  // Payoff Chart Curve data
  const payoffChart = useMemo(() => {
    const width = 600;
    const height = 200;
    const padding = 20;

    // We plot underlying prices around strike +/- 25%
    const minPriceRange = strikeVal * 0.75;
    const maxPriceRange = strikeVal * 1.25;

    const prices: number[] = [];
    const numPoints = 100;
    for (let i = 0; i <= numPoints; i++) {
      prices.push(minPriceRange + (maxPriceRange - minPriceRange) * (i / numPoints));
    }

    const pnls = prices.map(p => calculatePnlAtPrice(p));
    const maxPnl = Math.max(...pnls, costBasis, -costBasis);
    const minPnl = Math.min(...pnls, -costBasis);

    const xStep = (width - padding * 2) / numPoints;
    const yScale = (height - padding * 2) / (maxPnl - minPnl || 1);

    const points = prices
      .map((p, idx) => {
        const x = padding + idx * xStep;
        const y = height - padding - (pnls[idx] - minPnl) * yScale;
        return `${x},${y}`;
      })
      .join(' ');

    const zeroY = height - padding - (0 - minPnl) * yScale;

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Zero baseline */}
        <line
          x1={padding}
          y1={zeroY}
          x2={width - padding}
          y2={zeroY}
          stroke="#334155"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <text
          x={padding + 5}
          y={zeroY - 4}
          fill="#64748B"
          fontSize="8"
          fontFamily="monospace"
        >
          Break-Even Line
        </text>

        {/* Option curve */}
        <polyline
          fill="none"
          stroke={positionType === 'LONG' ? '#6366F1' : '#EF4444'}
          strokeWidth="2.5"
          points={points}
        />
      </svg>
    );
  }, [strikeVal, premVal, optionType, positionType, totalShares, costBasis]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Option Leg Parameters</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Option Type</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setOptionType('CALL')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    optionType === 'CALL' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Call
                </button>
                <button
                  onClick={() => setOptionType('PUT')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    optionType === 'PUT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Put
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Position</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPositionType('LONG')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    positionType === 'LONG' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Buy (Long)
                </button>
                <button
                  onClick={() => setPositionType('SHORT')}
                  className={`py-1.5 text-xs font-bold rounded transition ${
                    positionType === 'SHORT' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Sell (Short)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Underlying Price ($)</label>
              <input
                type="number"
                value={underlyingPrice}
                onChange={(e) => setUnderlyingPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Strike Price ($)</label>
              <input
                type="number"
                value={strikePrice}
                onChange={(e) => setStrikePrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Option Premium / Price ($)</label>
              <input
                type="number"
                step="0.05"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Contracts (1 contract = 100 shares)</label>
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Target Underlying Price at Expiration ($)</label>
              <input
                type="number"
                value={targetUnderlying}
                onChange={(e) => setTargetUnderlying(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary Payoff Metrics */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Options Expiration Payoff Metrics</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Break-Even Price</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                ${breakEven.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Premium Cost / Credit</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                {formatCurrency(costBasis)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Risk</span>
              <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                {maxLoss === Infinity ? 'Unlimited (Margin Risk)' : formatCurrency(maxLoss)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Potential Profit</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {maxProfit === Infinity ? 'Unlimited' : formatCurrency(maxProfit)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">
                Payoff at Target Underlying (${tgtVal.toFixed(2)})
              </span>
              <div className={`text-2xl font-black mt-1 font-mono ${targetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {targetPnl >= 0 ? `+${formatCurrency(targetPnl)}` : formatCurrency(targetPnl)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payoff Curve */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Risk Profile / Expiration Profit Curve</h4>
        <div className="w-full h-[200px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800/60 relative">
          {payoffChart}
        </div>
      </div>
    </div>
  );
};
