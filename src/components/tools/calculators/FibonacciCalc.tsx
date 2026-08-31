import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface FibonacciCalcProps {
  onClose: () => void;
}

export const FibonacciCalc: React.FC<FibonacciCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [swingLow, setSwingLow] = useState('100');
  const [swingHigh, setSwingHigh] = useState('200');

  const lowVal = parseFloat(swingLow) || 0;
  const highVal = parseFloat(swingHigh) || 0;
  const range = Math.max(0, highVal - lowVal);

  const retracementLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const extensionLevels = [1.272, 1.382, 1.618, 2.618];

  const handleReset = () => {
    setDirection('UP');
    setSwingLow('100');
    setSwingHigh('200');
  };

  const getRetracementPrice = (level: number) => {
    if (direction === 'UP') {
      return highVal - (range * level);
    } else {
      return lowVal + (range * level);
    }
  };

  const getExtensionPrice = (level: number) => {
    if (direction === 'UP') {
      return highVal + (range * (level - 1));
    } else {
      return lowVal - (range * (level - 1));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fibonacci Parameters</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block font-bold">Trend Direction</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDirection('UP')}
                  className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    direction === 'UP' ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Bullish (Uptrend)
                </button>
                <button
                  onClick={() => setDirection('DOWN')}
                  className={`flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    direction === 'DOWN' ? 'bg-rose-600/20 border border-rose-500/50 text-rose-400' : 'text-slate-400'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> Bearish (Downtrend)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Swing Low Price ($)</label>
                <input
                  type="number"
                  value={swingLow}
                  onChange={(e) => setSwingLow(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Swing High Price ($)</label>
                <input
                  type="number"
                  value={swingHigh}
                  onChange={(e) => setSwingHigh(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Retracements & Extensions Matrix */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fibonacci Levels</h4>

          {/* Grid splits into two parts: Retracement and Extension lists */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Retracements */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retracement Levels</span>
              <div className="space-y-2">
                {retracementLevels.map((lvl, idx) => {
                  const price = getRetracementPrice(lvl);
                  const isGolden = lvl === 0.618;
                  return (
                    <div
                      key={idx}
                      className={`flex justify-between items-center p-2 rounded-lg text-xs font-mono ${
                        isGolden ? 'bg-indigo-600/10 border border-indigo-500/30' : 'bg-slate-950/40'
                      }`}
                    >
                      <span className={isGolden ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                        {(lvl * 100).toFixed(1)}% {isGolden && '(Golden)'}
                      </span>
                      <span className="text-slate-200 font-bold">{price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extensions */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Extension Levels</span>
              <div className="space-y-2">
                {extensionLevels.map((lvl, idx) => {
                  const price = getExtensionPrice(lvl);
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg text-xs font-mono bg-slate-950/40"
                    >
                      <span className="text-slate-400">{(lvl * 100).toFixed(1)}%</span>
                      <span className="text-slate-200 font-bold">{price.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
