import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Zap,
  Calendar,
  BookOpen,
  Users2,
  Trash2
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setActiveView,
    theme,
  } = useTrading();

  const isLight = theme === 'light';

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'TRADE_SYNC':
        return <Zap className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />;
      case 'RISK_ALERT':
        return <AlertTriangle className={`w-4 h-4 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />;
      case 'GOAL_ACHIEVED':
        return <CheckCheck className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />;
      case 'ECONOMIC_REMINDER':
        return <Calendar className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />;
      case 'JOURNAL_REMINDER':
        return <BookOpen className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-violet-400'}`} />;
      default:
        return <Bell className={`w-4 h-4 ${isLight ? 'text-zinc-500' : 'text-slate-400'}`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l ${
          isLight ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isLight ? 'border-zinc-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-indigo-400'}`} />
            <h2 className={`text-sm font-bold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>Notifications & Alerts</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              }`}>
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className={`text-xs p-1.5 rounded-lg transition ${
                  isLight ? 'text-zinc-400 hover:text-rose-600 hover:bg-zinc-100' : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                }`}
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isLight ? 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className={`text-center py-16 ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No new notifications</p>
              <p className={`text-xs mt-1 ${isLight ? 'text-zinc-400' : 'text-slate-600'}`}>All trade alerts and risk monitors are normal</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  notif.read
                    ? isLight
                      ? 'bg-zinc-50/70 border-zinc-200 opacity-75'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-75'
                    : isLight
                    ? 'bg-white border-blue-200 shadow-xs'
                    : 'bg-slate-800/80 border-indigo-500/30 shadow-md shadow-indigo-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border shrink-0 ${
                    isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-semibold ${isLight ? 'text-zinc-900' : 'text-slate-100'}`}>{notif.title}</h4>
                      <span className={`text-[10px] ${isLight ? 'text-zinc-400' : 'text-slate-500'}`}>{notif.timestamp}</span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-zinc-600' : 'text-slate-400'}`}>{notif.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-600' : 'border-slate-800 bg-slate-950 text-slate-400'
        }`}>
          <span>Real-time background sync active</span>
          <button
            onClick={() => {
              onClose();
              setActiveView('goals');
            }}
            className={`font-semibold text-xs transition ${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-indigo-400 hover:text-indigo-300'}`}
          >
            Configure Risk Limits →
          </button>
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
