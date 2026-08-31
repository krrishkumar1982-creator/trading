import React, { useState, useMemo } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, Play, BarChart2 } from 'lucide-react';

interface MonteCarloCalcProps {
  onClose: () => void;
}

export const MonteCarloCalc: React.FC<MonteCarloCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [startBalance, setStartBalance] = useState('50000');
  const [numTrades, setNumTrades] = useState('100');
  const [winRate, setWinRate] = useState('50');
  const [avgWin, setAvgWin] = useState('1000');
  const [avgLoss, setAvgLoss] = useState('500');
  const [riskPerTrade, setRiskPerTrade] = useState('1.0');
  const [numSimulations, setNumSimulations] = useState<number>(1000);

  // Simulation results
  const [simResults, setSimResults] = useState<{
    medianFinal: number;
    bestFinal: number;
    worstFinal: number;
    avgFinal: number;
    maxDrawdown: number;
    probProfit: number;
    probLoss: number;
    probRuin: number;
    expectedValue: number;
    chartPaths: number[][]; // Subset of paths for rendering
    percentiles: { [key: number]: number };
  } | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  const handleRunSimulation = () => {
    setIsRunning(true);

    // Timeout to prevent UI freezing and show loading state
    setTimeout(() => {
      const startBal = parseFloat(startBalance) || 50000;
      const tradesCount = parseInt(numTrades) || 50;
      const winPct = (parseFloat(winRate) || 50) / 100;
      const winAmt = parseFloat(avgWin) || 1000;
      const lossAmt = parseFloat(avgLoss) || 500;
      const simCount = numSimulations;
      const ruinThreshold = startBal * 0.5; // Ruin at 50% drawdown

      let sumFinalBalance = 0;
      let profitSims = 0;
      let ruinSims = 0;
      let maxDrawdownGlobal = 0;

      const finalBalances: number[] = [];
      const pathsForChart: number[][] = [];
      const numChartPaths = 15; // Plot 15 paths to keep chart clean and high performance

      for (let s = 0; s < simCount; s++) {
        let balance = startBal;
        let peak = startBal;
        let maxSimDd = 0;
        let breachedRuin = false;
        const currentPath: number[] = [balance];

        for (let t = 0; t < tradesCount; t++) {
          const isWin = Math.random() < winPct;
          const outcome = isWin ? winAmt : -lossAmt;
          balance += outcome;

          if (balance <= 0) {
            balance = 0;
          }

          if (balance < ruinThreshold) {
            breachedRuin = true;
          }

          currentPath.push(balance);

          if (balance > peak) {
            peak = balance;
          }
          const dd = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
          if (dd > maxSimDd) {
            maxSimDd = dd;
          }
        }

        finalBalances.push(balance);
        sumFinalBalance += balance;
        if (balance > startBal) {
          profitSims++;
        }
        if (breachedRuin) {
          ruinSims++;
        }
        if (maxSimDd > maxDrawdownGlobal) {
          maxDrawdownGlobal = maxSimDd;
        }

        // Save a subset of paths to display on the SVG chart
        if (s < numChartPaths) {
          pathsForChart.push(currentPath);
        }
      }

      // Sort final balances to compute percentiles and extreme cases
      finalBalances.sort((a, b) => a - b);
      const bestFinal = finalBalances[finalBalances.length - 1];
      const worstFinal = finalBalances[0];
      const medianFinal = finalBalances[Math.floor(finalBalances.length * 0.5)];
      const avgFinal = sumFinalBalance / simCount;

      const expectedValue = (winPct * winAmt) - ((1 - winPct) * lossAmt);

      // Percentiles
      const pct10 = finalBalances[Math.floor(simCount * 0.1)];
      const pct25 = finalBalances[Math.floor(simCount * 0.25)];
      const pct75 = finalBalances[Math.floor(simCount * 0.75)];
      const pct90 = finalBalances[Math.floor(simCount * 0.9)];

      setSimResults({
        medianFinal,
        bestFinal,
        worstFinal,
        avgFinal,
        maxDrawdown: maxDrawdownGlobal,
        probProfit: (profitSims / simCount) * 100,
        probLoss: ((simCount - profitSims) / simCount) * 100,
        probRuin: (ruinSims / simCount) * 100,
        expectedValue,
        chartPaths: pathsForChart,
        percentiles: { 10: pct10, 25: pct25, 75: pct75, 90: pct90 },
      });

      setIsRunning(false);
    }, 100);
  };

  const handleReset = () => {
    setStartBalance('50000');
    setNumTrades('100');
    setWinRate('50');
    setAvgWin('1000');
    setAvgLoss('500');
    setRiskPerTrade('1.0');
    setNumSimulations(1000);
    setSimResults(null);
  };

  // SVG Chart generator logic
  const svgChart = useMemo(() => {
    if (!simResults || simResults.chartPaths.length === 0) return null;

    const width = 600;
    const height = 240;
    const padding = 20;

    // Find min and max elements in all chart paths
    let maxVal = Math.max(...simResults.chartPaths.flatMap(p => p));
    let minVal = Math.min(...simResults.chartPaths.flatMap(p => p));

    // Padding for min/max to ensure they fit in the SVG frame
    maxVal = maxVal * 1.05;
    minVal = Math.max(0, minVal * 0.95);

    const xStep = (width - padding * 2) / (parseInt(numTrades) || 1);
    const yScale = (height - padding * 2) / (maxVal - minVal || 1);

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => {
          const yVal = minVal + (maxVal - minVal) * ratio;
          const yPos = height - padding - (yVal - minVal) * yScale;
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

        {/* Plotting simulation paths */}
        {simResults.chartPaths.map((path, pIdx) => {
          const points = path
            .map((val, step) => {
              const x = padding + step * xStep;
              const y = height - padding - (val - minVal) * yScale;
              return `${x},${y}`;
            })
            .join(' ');

          // Color palette for simulated curves
          const strokeColors = [
            '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#84CC16'
          ];
          const color = strokeColors[pIdx % strokeColors.length];

          return (
            <polyline
              key={pIdx}
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              strokeOpacity="0.75"
              points={points}
            />
          );
        })}
      </svg>
    );
  }, [simResults, numTrades, formatCurrency]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Inputs</h4>
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
                onChange={(e) => setStartBalance(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Number of Trades</label>
              <input
                type="number"
                value={numTrades}
                onChange={(e) => setNumTrades(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

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
              <label className="text-xs text-slate-400 mb-1 block">Avg Win Amount ($)</label>
              <input
                type="number"
                value={avgWin}
                onChange={(e) => setAvgWin(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Avg Loss Amount ($)</label>
              <input
                type="number"
                value={avgLoss}
                onChange={(e) => setAvgLoss(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Risk Per Trade (%)</label>
              <input
                type="number"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Number of Simulations</label>
              <div className="grid grid-cols-5 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[100, 500, 1000, 5000, 10000].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumSimulations(num)}
                    className={`py-1 text-[10px] font-bold rounded transition ${
                      numSimulations === num ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {num.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Simulating Paths...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Monte Carlo Simulator
              </>
            )}
          </button>
        </div>

        {/* Right: Summary Metrics */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Statistical Aggregates</h4>

          {simResults ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Median Final Balance</span>
                <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                  {formatCurrency(simResults.medianFinal)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Drawdown Realized</span>
                <div className="text-xl font-black text-rose-400 mt-1 font-mono">
                  {simResults.maxDrawdown.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Probability of Profit</span>
                <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                  {simResults.probProfit.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Probability of Ruin (50% DD)</span>
                <div className="text-lg font-bold text-rose-500 mt-1 font-mono">
                  {simResults.probRuin.toFixed(1)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Best Outcome</span>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {formatCurrency(simResults.bestFinal)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Worst Outcome</span>
                <div className="text-base font-bold text-slate-200 mt-1 font-mono">
                  {formatCurrency(simResults.worstFinal)}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center border border-slate-800 border-dashed rounded-2xl bg-slate-950 text-slate-500 text-xs">
              <BarChart2 className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
              <span>Click run to compute simulated pathways.</span>
            </div>
          )}
        </div>
      </div>

      {/* Equity curves graphic */}
      {simResults && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Randomized Equity Curves (First {simResults.chartPaths.length} Seeds)</h4>
            <div className="flex gap-4 text-[10px] font-mono text-slate-500">
              <div>P10: <span className="text-slate-300">{formatCurrency(simResults.percentiles[10])}</span></div>
              <div>P90: <span className="text-slate-300">{formatCurrency(simResults.percentiles[90])}</span></div>
            </div>
          </div>
          <div className="w-full h-[240px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800/60 relative">
            {svgChart}
          </div>
        </div>
      )}
    </div>
  );
};
