import React from 'react';
import {
  Clock,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { PendingOrder } from '../types';

interface PendingOrdersTableProps {
  orders: PendingOrder[];
  onCancelOrder: (orderId: string) => void;
  formatCurrency: (val: number) => string;
  decimals?: number;
}

export const PendingOrdersTable: React.FC<PendingOrdersTableProps> = ({
  orders,
  onCancelOrder,
  formatCurrency,
  decimals = 5,
}) => {
  const pendingOnly = orders.filter(o => o.status === 'PENDING');

  if (pendingOnly.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <Clock className="w-8 h-8 text-slate-600 mb-2" />
        <div className="text-sm font-semibold text-slate-400">No Active Pending Orders</div>
        <div className="text-xs text-slate-500 max-w-sm mt-0.5">
          Place Limit or Stop orders from the Order Pad or right-click context menu. They will auto-fill when replay price crosses the target.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-950/60 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-800">
          <tr>
            <th className="py-2 px-3">Order ID</th>
            <th className="py-2 px-3">Type</th>
            <th className="py-2 px-3">Symbol</th>
            <th className="py-2 px-3">Lots</th>
            <th className="py-2 px-3">Target Price</th>
            <th className="py-2 px-3">Stop Loss</th>
            <th className="py-2 px-3">Take Profit</th>
            <th className="py-2 px-3">Placed Time</th>
            <th className="py-2 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono">
          {pendingOnly.map(order => {
            const isBuy = order.direction === 'BUY';
            return (
              <tr key={order.id} className="hover:bg-slate-900/60 transition">
                <td className="py-2.5 px-3 text-slate-400 font-bold">{order.id.slice(-6)}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isBuy
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {order.orderType} {order.direction}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-white">{order.symbol}</td>
                <td className="py-2.5 px-3 text-slate-200">{order.lotSize}</td>
                <td className="py-2.5 px-3 font-bold text-amber-400">
                  {order.targetPrice.toFixed(decimals)}
                </td>
                <td className="py-2.5 px-3 text-rose-400">
                  {order.stopLoss ? order.stopLoss.toFixed(decimals) : '-'}
                </td>
                <td className="py-2.5 px-3 text-emerald-400">
                  {order.takeProfit ? order.takeProfit.toFixed(decimals) : '-'}
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">{order.placedTimeString}</td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
