import React, { useState } from 'react';
import { useTrading } from '../../../context/TradingContext';
import { RefreshCw, Coins } from 'lucide-react';

interface StockProfitCalcProps {
  onClose: () => void;
}

export const StockProfitCalc: React.FC<StockProfitCalcProps> = ({ onClose }) => {
  const { formatCurrency } = useTrading();

  // Inputs
  const [shares, setShares] = useState('100');
  const [entryPrice, setEntryPrice] = useState('150');
  const [exitPrice, setExitPrice] = useState('165');
  const [buyCommission, setBuyCommission] = useState('4.95');
  const [sellCommission, setSellCommission] = useState('4.95');
  const [regTaxPercent, setRegTaxPercent] = useState('0.00229'); // SEC fee approx
  const [leverage, setLeverage] = useState('1'); // Margin leverage e.g. 1, 2, 4, 10

  const handleReset = () => {
    setShares('100');
    setEntryPrice('150');
    setExitPrice('165');
    setBuyCommission('4.95');
    setSellCommission('4.95');
    setRegTaxPercent('0.00229');
    setLeverage('1');
  };

  const qty = parseFloat(shares) || 100;
  const buyP = parseFloat(entryPrice) || 150;
  const sellP = parseFloat(exitPrice) || 165;
  const buyComm = parseFloat(buyCommission) || 4.95;
  const sellComm = parseFloat(sellCommission) || 4.95;
  const taxPct = (parseFloat(regTaxPercent) || 0) / 100;
  const lev = parseFloat(leverage) || 1;

  // Calculations
  const grossBuy = qty * buyP;
  const grossSell = qty * sellP;
  const grossProfit = grossSell - grossBuy;

  const regFee = grossSell * taxPct;
  const totalCosts = buyComm + sellComm + regFee;
  const netPnl = grossProfit - totalCosts;

  // Margin leverage adjustment
  const requiredCapital = grossBuy / lev;
  const netRoi = requiredCapital > 0 ? (netPnl / requiredCapital) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Inputs</h4>
            <button
              onClick={handleReset}
              className="text-[10px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Shares Sizing</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Account Leverage (Margin)</label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="1">1:1 (Cash Account)</option>
                <option value="2">1:2 (Reg T Margin)</option>
                <option value="4">1:4 (Intraday Margin)</option>
                <option value="10">1:10 (Specialized Margin)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Entry Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block font-mono">Exit Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Buy Commission ($)</label>
              <input
                type="number"
                step="0.01"
                value={buyCommission}
                onChange={(e) => setBuyCommission(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sell Commission ($)</label>
              <input
                type="number"
                step="0.01"
                value={sellCommission}
                onChange={(e) => setSellCommission(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">SEC/Regulatory Transaction Fee %</label>
              <input
                type="number"
                step="0.0001"
                value={regTaxPercent}
                onChange={(e) => setRegTaxPercent(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary panels */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Sizing Outputs</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide font-mono">Gross Return</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                {formatCurrency(grossProfit)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Transaction Fees</span>
              <div className="text-xl font-bold text-rose-400 mt-1 font-mono font-mono">
                {formatCurrency(totalCosts)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Net P&L Return</span>
              <div className={`text-xl font-black mt-1 font-mono ${netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPnl >= 0 ? `+${formatCurrency(netPnl)}` : formatCurrency(netPnl)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Capital Required</span>
              <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
                {formatCurrency(requiredCapital)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wide">Collateral Adjusted Trade ROI</span>
              <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                {netRoi.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Sizing description / educational insight */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              Leveraged Capital Efficiencies
            </span>
            <p>
              By using margin leverage, you reduce the direct cash collateral needed to open the trade. This magnifies your <strong>net ROI</strong>, but it is a double-edged sword: losses are also magnified relative to your deposited cash collateral.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
