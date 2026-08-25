import React, { useState } from 'react';
import {
  X,
  GitCompare,
  Search,
  Check,
} from 'lucide-react';
import { INSTRUMENTS } from '../instruments';

interface CompareSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  comparedSymbol: string | null;
  onSelectCompareSymbol: (symbol: string | null) => void;
}

export const CompareSymbolModal: React.FC<CompareSymbolModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  comparedSymbol,
  onSelectCompareSymbol,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = INSTRUMENTS.filter(
    i =>
      i.symbol !== currentSymbol &&
      (i.symbol.toLowerCase().includes(search.toLowerCase()) ||
        i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Compare Asset Overlay</h2>
              <p className="text-xs text-slate-400">Relative performance & intermarket divergence</p>
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
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {comparedSymbol && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-sky-300 text-xs">
              <span>Active Overlay: <strong>{comparedSymbol}</strong></span>
              <button
                onClick={() => onSelectCompareSymbol(null)}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold"
              >
                Remove
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search instrument to compare (e.g. SPX500, XAUUSD)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.map(inst => {
              const isSelected = inst.symbol === comparedSymbol;
              return (
                <div
                  key={inst.symbol}
                  onClick={() => {
                    onSelectCompareSymbol(inst.symbol);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600/20 border border-sky-500/40 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {inst.symbol}
                      <span className="text-[9px] text-slate-400 font-normal">({inst.category})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{inst.name}</div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
