import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  PieChart,
  Scale,
} from 'lucide-react';
import { DemoAccount } from '../types';

interface AccountSummaryTabProps {
  account: DemoAccount;
  formatCurrency: (val: number) => string;
}

export const AccountSummaryTab: React.FC<AccountSummaryTabProps> = ({
  account,
  formatCurrency,
}) => {
  const marginUsagePct =
    account.equity > 0 ? ((account.usedMargin / account.equity) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
            <span>Starting Capital</span>
            <DollarSign className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-base font-black font-mono text-white mt-1">
            {formatCurrency(account.startingBalance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Initial base equity</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
            <span>Current Balance</span>
            <Scale className="w-3 h-3 text-sky-400" />
          </div>
          <div className="text-base font-black font-mono text-white mt-1">
            {formatCurrency(account.balance)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Realized closed trades</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
            <span>Net Floating Equity</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div
            className={`text-base font-black font-mono mt-1 ${
              account.equity >= account.startingBalance ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(account.equity)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Return: {account.totalReturnPercent.toFixed(2)}%
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
            <span>Peak Drawdown</span>
            <TrendingDown className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-base font-black font-mono text-rose-400 mt-1">
            {account.maxDrawdownPercent.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            -{formatCurrency(account.maxDrawdown)}
          </div>
        </div>
      </div>

      {/* Margin & Leverage Detailed Bar */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Margin & Risk Utilization (1:{account.leverage} Leverage)</span>
          </span>
          <span className="font-mono text-slate-400">
            {marginUsagePct}% Used ({formatCurrency(account.usedMargin)})
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${Math.min(100, parseFloat(marginUsagePct))}%` }}
          />
          <div className="flex-1 bg-emerald-600/30" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
          <div className="text-slate-400">
            Used Margin: <strong className="text-white">{formatCurrency(account.usedMargin)}</strong>
          </div>
          <div className="text-slate-400">
            Free Margin: <strong className="text-emerald-400">{formatCurrency(account.freeMargin)}</strong>
          </div>
          <div className="text-slate-400">
            Margin Level: <strong className="text-indigo-400">{account.marginLevel.toFixed(0)}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
