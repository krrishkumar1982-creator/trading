import React from 'react';
import {
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ShieldAlert,
  Target,
  AlertCircle,
} from 'lucide-react';
import { ReplayPosition } from './types';

interface OpenPositionsTableProps {
  positions: ReplayPosition[];
  onClosePosition: (id: string) => void;
  onCloseAll: () => void;
  onPartialClose?: (id: string, percent: number) => void;
  onBreakeven?: (id: string) => void;
  onReverse?: (id: string) => void;
  formatCurrency: (val: number) => string;
}

export const OpenPositionsTable: React.FC<OpenPositionsTableProps> = ({
  positions,
  onClosePosition,
  onCloseAll,
  onPartialClose,
  onBreakeven,
  onReverse,
  formatCurrency,
}) => {
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40">
        <Layers className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <p className="text-xs font-semibold text-slate-400">No Open Replay Positions</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          Execute Buy or Sell orders in the Order Pad to open simulated market positions during replay.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top summary row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Open Positions: <strong className="text-white">{positions.length}</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Floating P&L:{' '}
            <strong className={totalUnrealizedPnl >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}
              {formatCurrency(totalUnrealizedPnl)}
            </strong>
          </span>
        </div>

        {positions.length > 1 && (
          <button
            onClick={onCloseAll}
            className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-xs font-bold transition"
          >
            Close All Positions ({positions.length})
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 bg-slate-900/50 text-[11px]">
              <th className="py-2.5 px-3">Symbol</th>
              <th className="py-2.5 px-3">Side</th>
              <th className="py-2.5 px-3">Size (Lots)</th>
              <th className="py-2.5 px-3">Entry</th>
              <th className="py-2.5 px-3">Current</th>
              <th className="py-2.5 px-3">SL / TP</th>
              <th className="py-2.5 px-3">Floating P&L</th>
              <th className="py-2.5 px-3">Open Time</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {positions.map(pos => {
              const isProfit = pos.unrealizedPnl >= 0;
              return (
                <tr key={pos.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                    {pos.symbol}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        pos.direction === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {pos.direction === 'BUY' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {pos.direction}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{pos.lotSize}</td>
                  <td className="py-2.5 px-3 text-slate-300">{pos.entryPrice}</td>
                  <td className="py-2.5 px-3 font-bold text-white">{pos.currentPrice}</td>
                  <td className="py-2.5 px-3 text-[10px] text-slate-400">
                    <div>SL: {pos.stopLoss ? <span className="text-rose-400">{pos.stopLoss}</span> : 'None'}</div>
                    <div>TP: {pos.takeProfit ? <span className="text-emerald-400">{pos.takeProfit}</span> : 'None'}</div>
                  </td>
                  <td className="py-2.5 px-3 font-bold">
                    <div className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                      {isProfit ? '+' : ''}
                      {formatCurrency(pos.unrealizedPnl)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {isProfit ? '+' : ''}
                      {pos.unrealizedPnlPercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                    {pos.openTimeString}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onBreakeven && (
                        <button
                          onClick={() => onBreakeven(pos.id)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition cursor-pointer"
                          title="Move Stop Loss to Break-Even (Entry Price)"
                        >
                          BE
                        </button>
                      )}

                      {onPartialClose && (
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          {[25, 50, 75].map(pct => (
                            <button
                              key={pct}
                              onClick={() => onPartialClose(pos.id, pct)}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono text-sky-400 hover:text-white hover:bg-sky-600 transition cursor-pointer"
                              title={`Close ${pct}% of position`}
                            >
                              {pct}%
                            </button>
                          ))}
                        </div>
                      )}

                      {onReverse && (
                        <button
                          onClick={() => onReverse(pos.id)}
                          className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold transition cursor-pointer"
                          title="Reverse Position (Close & Flip Direction)"
                        >
                          Rev
                        </button>
                      )}

                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        title="Close Full Position"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
