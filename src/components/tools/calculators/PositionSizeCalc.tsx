import React, { useState, useEffect } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface PositionSizeCalcProps {
  onClose: () => void;
}

type AssetClass = 'FUTURES' | 'FOREX' | 'STOCKS' | 'CRYPTO';

export const PositionSizeCalc: React.FC<PositionSizeCalcProps> = ({ onClose }) => {
  const { accounts, selectedAccountId, formatCurrency } = useTrading();

  // Find active account to prefill balance
  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const initialBalance = activeAccount ? activeAccount.currentBalance.toString() : '50000';

  // State Inputs
  const [accountBalance, setAccountBalance] = useState(initialBalance);
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [riskAmount, setRiskAmount] = useState('500');
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'DOLLARS'>('PERCENT');
  const [entryPrice, setEntryPrice] = useState('100');
  const [stopLossPrice, setStopLossPrice] = useState('95');
  const [takeProfitPrice, setTakeProfitPrice] = useState('115');
  const [assetClass, setAssetClass] = useState<AssetClass>('STOCKS');

  // Forex & Futures specific specs
  const [futuresSymbol, setFuturesSymbol] = useState('NQ');
  const [tickSize, setTickSize] = useState('0.25');
  const [tickValue, setTickValue] = useState('5.0');
  const [contractMultiplier, setContractMultiplier] = useState('20');
  const [commission, setCommission] = useState('2.50');

  // Sync inputs based on selected futures contract
  useEffect(() => {
    if (assetClass === 'FUTURES') {
      if (futuresSymbol === 'ES') {
        setTickSize('0.25'); setTickValue('12.5'); setContractMultiplier('50');
      } else if (futuresSymbol === 'MES') {
        setTickSize('0.25'); setTickValue('1.25'); setContractMultiplier('5');
      } else if (futuresSymbol === 'NQ') {
        setTickSize('0.25'); setTickValue('5.0'); setContractMultiplier('20');
      } else if (futuresSymbol === 'MNQ') {
        setTickSize('0.25'); setTickValue('0.5'); setContractMultiplier('2');
      } else if (futuresSymbol === 'CL') {
        setTickSize('0.01'); setTickValue('10.0'); setContractMultiplier('1000');
      } else if (futuresSymbol === 'GC') {
        setTickSize('0.10'); setTickValue('10.0'); setContractMultiplier('100');
      }
    }
  }, [futuresSymbol, assetClass]);

  // Synchronize Risk % vs Risk Dollars
  const handleRiskPercentChange = (val: string) => {
    setRiskPercent(val);
    const balance = parseFloat(accountBalance) || 0;
    const pct = parseFloat(val) || 0;
    if (balance > 0) {
      setRiskAmount(((balance * pct) / 100).toFixed(2));
    }
  };

  const handleRiskDollarsChange = (val: string) => {
    setRiskAmount(val);
    const balance = parseFloat(accountBalance) || 0;
    const dollars = parseFloat(val) || 0;
    if (balance > 0) {
      setRiskPercent(((dollars / balance) * 100).toFixed(2));
    }
  };

  const handleBalanceChange = (val: string) => {
    setAccountBalance(val);
    const balance = parseFloat(val) || 0;
    if (riskMode === 'PERCENT') {
      const pct = parseFloat(riskPercent) || 0;
      setRiskAmount(((balance * pct) / 100).toFixed(2));
    } else {
      const dollars = parseFloat(riskAmount) || 0;
      if (balance > 0) {
        setRiskPercent(((dollars / balance) * 100).toFixed(2));
      }
    }
  };

  // Calculations
  const balanceVal = parseFloat(accountBalance) || 0;
  const entryVal = parseFloat(entryPrice) || 0;
  const stopVal = parseFloat(stopLossPrice) || 0;
  const tpVal = parseFloat(takeProfitPrice) || 0;
  const riskAmountVal = riskMode === 'PERCENT' ? (balanceVal * (parseFloat(riskPercent) || 0)) / 100 : (parseFloat(riskAmount) || 0);

  // Stop Distance
  const stopDistance = Math.abs(entryVal - stopVal);
  const isValidCalc = balanceVal > 0 && entryVal > 0 && stopVal > 0 && stopDistance > 0 && riskAmountVal > 0;

  let calculatedSize = 0;
  let totalPositionValue = 0;
  let potProfit = 0;
  let rewardRiskRatio = 0;
  let breakEvenPrice = entryVal;
  let maxPosRisk = riskAmountVal;

  if (isValidCalc) {
    if (assetClass === 'STOCKS' || assetClass === 'CRYPTO') {
      calculatedSize = Math.floor(riskAmountVal / stopDistance);
      totalPositionValue = calculatedSize * entryVal;
      if (tpVal > 0) {
        const profitDistance = Math.abs(tpVal - entryVal);
        potProfit = calculatedSize * profitDistance;
        rewardRiskRatio = profitDistance / stopDistance;
      }
      breakEvenPrice = entryVal + (parseFloat(commission) * 2) / (calculatedSize || 1);
    } else if (assetClass === 'FOREX') {
      // 1 Standard Lot = 100,000 units. Typically 1 pip stop distance risk is $10 for standard lot (EURUSD)
      const pipSize = 0.0001;
      const pipValuePerStandardLot = 10;
      const pipsAtRisk = stopDistance / pipSize;
      const riskPerLot = pipsAtRisk * pipValuePerStandardLot;
      calculatedSize = riskPerLot > 0 ? parseFloat((riskAmountVal / riskPerLot).toFixed(2)) : 0;
      totalPositionValue = calculatedSize * 100000 * entryVal;
      if (tpVal > 0) {
        const pipsProfit = Math.abs(tpVal - entryVal) / pipSize;
        potProfit = calculatedSize * pipsProfit * pipValuePerStandardLot;
        rewardRiskRatio = pipsProfit / (pipsAtRisk || 1);
      }
    } else if (assetClass === 'FUTURES') {
      const tSize = parseFloat(tickSize) || 0.25;
      const tVal = parseFloat(tickValue) || 5.0;
      const mult = parseFloat(contractMultiplier) || 20;
      const ticksAtRisk = stopDistance / tSize;
      const riskPerContract = ticksAtRisk * tVal;
      calculatedSize = riskPerContract > 0 ? Math.floor(riskAmountVal / riskPerContract) : 0;
      totalPositionValue = calculatedSize * entryVal * mult;
      if (tpVal > 0) {
        const ticksProfit = Math.abs(tpVal - entryVal) / tSize;
        potProfit = calculatedSize * ticksProfit * tVal;
        rewardRiskRatio = ticksProfit / (ticksAtRisk || 1);
      }
      breakEvenPrice = entryVal + (parseFloat(commission) * calculatedSize * 2) / (calculatedSize * mult || 1);
    }
    maxPosRisk = riskAmountVal + (calculatedSize * parseFloat(commission) * 2);
  }

  const handleReset = () => {
    setAccountBalance(initialBalance);
    setRiskPercent('1.0');
    setRiskAmount(((parseFloat(initialBalance) || 50000) * 0.01).toFixed(2));
    setRiskMode('PERCENT');
    setEntryPrice('100');
    setStopLossPrice('95');
    setTakeProfitPrice('115');
    setAssetClass('STOCKS');
    setFuturesSymbol('NQ');
    setCommission('2.50');
  };

  return (
    <div className="space-y-6">
      {/* Inputs and Results */}
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
              <label className="text-xs text-slate-400 mb-1 block">Asset Class</label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="STOCKS">Stocks / Equities</option>
                <option value="FUTURES">Futures Contracts</option>
                <option value="FOREX">Forex Pairs</option>
                <option value="CRYPTO">Crypto Pairs</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Balance ($)</label>
              <input
                type="number"
                value={accountBalance}
                onChange={(e) => handleBalanceChange(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {assetClass === 'FUTURES' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Futures Symbol</label>
                <select
                  value={futuresSymbol}
                  onChange={(e) => setFuturesSymbol(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="NQ">E-mini Nasdaq-100 (NQ)</option>
                  <option value="MNQ">Micro Nasdaq-100 (MNQ)</option>
                  <option value="ES">E-mini S&P 500 (ES)</option>
                  <option value="MES">Micro S&P 500 (MES)</option>
                  <option value="CL">Crude Oil (CL)</option>
                  <option value="GC">Gold (GC)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Risk Sizing Mode</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setRiskMode('PERCENT')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    riskMode === 'PERCENT' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Percent (%)
                </button>
                <button
                  onClick={() => setRiskMode('DOLLARS')}
                  className={`py-1 text-[10px] font-bold rounded transition-all ${
                    riskMode === 'DOLLARS' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Dollars ($)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                {riskMode === 'PERCENT' ? 'Risk Percentage (%)' : 'Risk Amount ($)'}
              </label>
              {riskMode === 'PERCENT' ? (
                <input
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => handleRiskPercentChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <input
                  type="number"
                  step="10"
                  value={riskAmount}
                  onChange={(e) => handleRiskDollarsChange(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Stop Loss Price</label>
              <input
                type="number"
                step="0.01"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Take Profit Price</label>
              <input
                type="number"
                step="0.01"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Commission Per Side ($)</label>
              <input
                type="number"
                step="0.1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Validation Banner */}
          {!isValidCalc && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-400 leading-relaxed">
              <strong>Validation Alert:</strong> Please enter a positive account balance, valid prices, and a non-zero stop loss distance.
            </div>
          )}
        </div>

        {/* Right: Results Dashboard */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Position Metrics</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Position Size</span>
              <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
                {calculatedSize.toLocaleString()}{' '}
                <span className="text-[10px] font-medium text-slate-400">
                  {assetClass === 'FUTURES' ? 'Contracts' : assetClass === 'FOREX' ? 'Lots' : 'Shares'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Risk Amount</span>
              <div className="text-2xl font-black text-rose-400 mt-1 font-mono">
                {formatCurrency(riskAmountVal)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Stop Loss Distance</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {stopDistance.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">pts</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Position Value</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {formatCurrency(totalPositionValue)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Risk/Reward Ratio</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {rewardRiskRatio > 0 ? `1 : ${rewardRiskRatio.toFixed(2)}` : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Potential Profit</span>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {potProfit > 0 ? `+${formatCurrency(potProfit)}` : 'N/A'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Break-Even Price</span>
              <div className="text-lg font-bold text-slate-200 mt-1 font-mono">
                ${breakEvenPrice.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Max Risk (inc. Fees)</span>
              <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                {formatCurrency(maxPosRisk)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
