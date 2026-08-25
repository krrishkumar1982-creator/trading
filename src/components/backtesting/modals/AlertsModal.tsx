import React, { useState } from 'react';
import {
  X,
  Bell,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChartAlert } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  decimals: number;
  alerts: ChartAlert[];
  onUpdateAlerts: (alerts: ChartAlert[]) => void;
  presetPrice?: number;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  decimals,
  alerts,
  onUpdateAlerts,
  presetPrice,
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(presetPrice || currentPrice);
  const [condition, setCondition] = useState<'CROSS_ABOVE' | 'CROSS_BELOW' | 'PRICE_ABOVE' | 'PRICE_BELOW'>('CROSS_ABOVE');
  const [message, setMessage] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: ChartAlert = {
      id: 'alert-' + Date.now(),
      symbol,
      condition,
      targetPrice,
      currentPrice,
      message: message || `${symbol} ${condition.replace('_', ' ')} ${targetPrice.toFixed(decimals)}`,
      createdAt: Date.now(),
      createdAtString: new Date().toLocaleTimeString(),
      triggered: false,
      soundEnabled,
    };
    onUpdateAlerts([newAlert, ...alerts]);
    setMessage('');
  };

  const handleDeleteAlert = (id: string) => {
    onUpdateAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Price Alerts ({symbol})</h2>
              <p className="text-xs text-slate-400">Triggered automatically during historical replay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Create Alert Form */}
          <form onSubmit={handleCreateAlert} className="space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Create New Price Trigger
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="CROSS_ABOVE">Crosses Above</option>
                  <option value="CROSS_BELOW">Crosses Below</option>
                  <option value="PRICE_ABOVE">Price Greater Than (&gt;=)</option>
                  <option value="PRICE_BELOW">Price Less Than (&lt;=)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between mb-1">
                  <span>Target Price</span>
                  <span className="font-mono text-indigo-400">Cur: {currentPrice.toFixed(decimals)}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Custom Alert Note (Optional)
              </label>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="e.g. Liquidity sweep confirmed, prepare 15m Long entry..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Play Sound on Trigger</span>
              </label>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alert</span>
              </button>
            </div>
          </form>

          {/* Active & Triggered Alerts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Configured Alerts ({alerts.length})</span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-500 text-xs">
                No active alerts set for this replay session.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      a.triggered
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          a.triggered
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {a.triggered ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {a.symbol} {a.condition.replace('_', ' ')} {a.targetPrice.toFixed(decimals)}
                          {a.triggered && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                              TRIGGERED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{a.message}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAlert(a.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
