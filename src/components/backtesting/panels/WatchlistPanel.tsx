import React, { useState } from 'react';
import {
  X,
  Star,
  Search,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Flame,
} from 'lucide-react';
import { InstrumentConfig, MarketCategory } from '../types';
import { INSTRUMENTS } from '../instruments';

interface WatchlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  theme: 'dark' | 'light' | 'liquid';
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  onSelectSymbol,
  theme,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | MarketCategory | 'FAVORITES'>('ALL');
  const [favorites, setFavorites] = useState<string[]>(['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD', 'NAS100']);

  if (!isOpen) return null;

  const toggleFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => (prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]));
  };

  const filtered = INSTRUMENTS.filter(inst => {
    const matchesSearch =
      inst.symbol.toLowerCase().includes(search.toLowerCase()) ||
      inst.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'FAVORITES') return favorites.includes(inst.symbol);
    return inst.category === activeCategory;
  });

  return (
    <div
      className={`w-72 sm:w-80 shrink-0 h-full flex flex-col rounded-2xl border transition-all overflow-hidden ${
        theme === 'liquid'
          ? 'bg-slate-900/90 border-slate-700/60 backdrop-blur-md shadow-2xl'
          : theme === 'dark'
          ? 'bg-slate-950/95 border-slate-800 shadow-xl'
          : 'bg-white border-slate-200 shadow-md'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-center gap-1.5 font-bold text-xs text-white">
          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
          <span>Market Watchlist</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Category Pills */}
      <div className="p-2 space-y-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search instruments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold custom-scrollbar">
          {(['ALL', 'FAVORITES', 'FOREX', 'CRYPTO', 'INDICES', 'COMMODITIES'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'FAVORITES' ? '⭐ Favs' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
        {filtered.map(inst => {
          const isSelected = inst.symbol === currentSymbol;
          const isFav = favorites.includes(inst.symbol);
          const isPositive = (inst.change24h || 0) >= 0;

          return (
            <div
              key={inst.symbol}
              onClick={() => onSelectSymbol(inst.symbol)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                  : 'hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={e => toggleFavorite(inst.symbol, e)}
                  className="text-slate-500 hover:text-amber-400 transition"
                >
                  <Star
                    className={`w-3 h-3 ${
                      isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
                <div>
                  <div className="font-bold text-white flex items-center gap-1">
                    <span>{inst.symbol}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[90px]">
                    {inst.name}
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="font-semibold text-white">
                  {inst.defaultPrice.toFixed(inst.decimals)}
                </div>
                <div
                  className={`text-[10px] font-bold flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  <span>{isPositive ? '+' : ''}{inst.change24h}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
