import React, { useState } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  FileSpreadsheet,
  BookOpen,
  Tag,
  Star,
  ShieldAlert,
  Scale,
} from 'lucide-react';
import { ReplayTrade } from './types';
import { TradeJournalModal } from './modals/TradeJournalModal';

interface TradeHistoryTableProps {
  trades: ReplayTrade[];
  onUpdateTrade?: (updatedTrade: ReplayTrade) => void;
  formatCurrency: (val: number) => string;
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  onUpdateTrade,
  formatCurrency,
}) => {
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<ReplayTrade | null>(null);

  const filteredTrades = trades.filter(t => {
    if (filterOutcome === 'WIN' && t.realizedPnl <= 0) return false;
    if (filterOutcome === 'LOSS' && t.realizedPnl >= 0) return false;
    if (searchSymbol && !t.symbol.toLowerCase().includes(searchSymbol.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'Trade ID',
      'Symbol',
      'Direction',
      'Lots',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Take Profit',
      'Open Time',
      'Close Time',
      'Gross PnL ($)',
      'Commission ($)',
      'Spread Cost ($)',
      'Slippage Cost ($)',
      'Net Realized PnL ($)',
      'PnL (%)',
      'R-Multiple',
      'Exit Reason',
      'Strategy Setup',
      'Market Condition',
      'Session',
      'Tags',
      'Mistake Tag',
      'Discipline Rating',
      'Pre-Trade Note',
      'Post-Trade Review',
      'Duration (Candles)'
    ];

    const rows = trades.map(t => [
      t.id,
      t.symbol,
      t.direction,
      t.lotSize,
      t.entryPrice,
      t.exitPrice,
      t.stopLoss || '',
      t.takeProfit || '',
      `"${t.openTimeString}"`,
      `"${t.closeTimeString}"`,
      (t.grossPnl ?? t.realizedPnl).toFixed(2),
      (t.commission || 0).toFixed(2),
      (t.spreadCost || 0).toFixed(2),
      (t.slippageCost || 0).toFixed(2),
      t.realizedPnl.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.rMultiple.toFixed(2),
      t.exitReason,
      `"${t.strategySetup || ''}"`,
      `"${t.marketCondition || ''}"`,
      `"${t.sessionTag || ''}"`,
      `"${t.tags?.join('; ') || ''}"`,
      `"${t.mistakeTag || ''}"`,
      t.disciplineRating || 5,
      `"${(t.notesBefore || '').replace(/"/g, '""')}"`,
      `"${(t.notesAfter || t.lessonsLearned || '').replace(/"/g, '""')}"`,
      t.durationCandles
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Backtest_Trade_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (trades.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(trades, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Backtest_Trades_Full_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40">
        <History className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <p className="text-xs font-semibold text-slate-400">No Closed Trades in this Session</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          Completed trades and auto-closed bracket orders (SL/TP) will be recorded here with realistic execution costs, setup tags, and journal review notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls & Export Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
            {(['ALL', 'WIN', 'LOSS'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setFilterOutcome(opt)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  filterOutcome === opt
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt === 'ALL' ? 'All Trades' : opt === 'WIN' ? 'Winners' : 'Losers'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredTrades.length} of {trades.length}
          </span>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
            title="Download CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
            title="Download JSON"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Trade History Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50 text-[11px]">
              <th className="py-2.5 px-3">Trade / Setup</th>
              <th className="py-2.5 px-3">Side</th>
              <th className="py-2.5 px-3">Size</th>
              <th className="py-2.5 px-3">Entry & Exit</th>
              <th className="py-2.5 px-3">SL / TP</th>
              <th className="py-2.5 px-3">Costs</th>
              <th className="py-2.5 px-3">Net Realized</th>
              <th className="py-2.5 px-3">R-Multiple</th>
              <th className="py-2.5 px-3">Exit Reason</th>
              <th className="py-2.5 px-3 text-right">Journal & Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredTrades.map(trade => {
              const isWin = trade.realizedPnl > 0;
              const isBE = trade.realizedPnl === 0;
              const totalCost = (trade.commission || 0) + (trade.spreadCost || 0) + (trade.slippageCost || 0);

              return (
                <tr key={trade.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{trade.symbol}</span>
                      <span className="text-[10px] text-slate-500 font-normal">#{trade.id.slice(-6)}</span>
                    </div>
                    {trade.strategySetup && (
                      <div className="text-[10px] text-indigo-400 font-semibold truncate max-w-[140px]">
                        {trade.strategySetup}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.direction === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {trade.direction === 'BUY' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{trade.lotSize}L</td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-300">In: {trade.entryPrice}</div>
                    <div className="text-white font-bold">Out: {trade.exitPrice}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-400">
                    <div>SL: {trade.stopLoss ? <span className="text-rose-400">{trade.stopLoss}</span> : '-'}</div>
                    <div>TP: {trade.takeProfit ? <span className="text-emerald-400">{trade.takeProfit}</span> : '-'}</div>
                  </td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-400">
                    <div>Total: <span className="text-slate-200 font-bold">{formatCurrency(totalCost)}</span></div>
                    <div className="text-[9px] text-slate-500">Comm: {formatCurrency(trade.commission || 0)}</div>
                  </td>
                  <td className="py-2.5 px-3 font-bold">
                    <div className={isWin ? 'text-emerald-400' : isBE ? 'text-slate-400' : 'text-rose-400'}>
                      {isWin ? '+' : ''}
                      {formatCurrency(trade.realizedPnl)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isWin ? '+' : ''}
                      {trade.pnlPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        trade.rMultiple > 0
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : trade.rMultiple < 0
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {trade.rMultiple > 0 ? '+' : ''}
                      {trade.rMultiple.toFixed(2)}R
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.exitReason === 'TP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : trade.exitReason === 'SL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}
                    >
                      {trade.exitReason === 'TP'
                        ? 'Target (TP)'
                        : trade.exitReason === 'SL'
                        ? 'Stop Loss (SL)'
                        : trade.exitReason === 'PARTIAL'
                        ? 'Partial'
                        : 'Manual'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedTradeForJournal(trade)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition cursor-pointer"
                      title="Open Trade Journal & Review"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Trade Journal Modal */}
      {selectedTradeForJournal && onUpdateTrade && (
        <TradeJournalModal
          isOpen={!!selectedTradeForJournal}
          onClose={() => setSelectedTradeForJournal(null)}
          trade={selectedTradeForJournal}
          onUpdateTrade={onUpdateTrade}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};
