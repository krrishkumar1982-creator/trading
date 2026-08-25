import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Star,
  Clock,
  BarChart2,
  TrendingUp,
  Sliders,
  Bell,
  Layers,
  LayoutGrid,
  Camera,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  ChevronDown,
  Sparkles,
  GitCompare,
  Settings,
  Flame,
  Bookmark,
  Check,
} from 'lucide-react';
import {
  ChartType,
  TimeframeId,
  ChartLayoutType,
  InstrumentConfig,
  IndicatorConfig,
} from '../types';
import { INSTRUMENTS, TIMEFRAMES } from '../instruments';

interface TopChartToolbarProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentTimeframe: TimeframeId;
  onSelectTimeframe: (tf: TimeframeId) => void;
  chartType: ChartType;
  onSelectChartType: (ct: ChartType) => void;
  layout: ChartLayoutType;
  onSelectLayout: (layout: ChartLayoutType) => void;
  activeIndicatorsCount: number;
  onOpenIndicatorsModal: () => void;
  onOpenTemplatesModal: () => void;
  onOpenAlertsModal: () => void;
  onOpenCompareModal: () => void;
  onOpenSettingsModal: () => void;
  onTakeScreenshot: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isWatchlistOpen: boolean;
  onToggleWatchlist: () => void;
  theme: 'dark' | 'light' | 'liquid';
}

const CHART_TYPES: { id: ChartType; label: string; icon: string }[] = [
  { id: 'CANDLESTICK', label: 'Candlestick', icon: '🕯️' },
  { id: 'BAR', label: 'OHLC Bar', icon: '📊' },
  { id: 'LINE', label: 'Line', icon: '📈' },
  { id: 'AREA', label: 'Area', icon: '🏔️' },
  { id: 'HEIKIN_ASHI', label: 'Heikin Ashi', icon: '🎋' },
  { id: 'RENKO', label: 'Renko Bricks', icon: '🧱' },
];

export const TopChartToolbar: React.FC<TopChartToolbarProps> = ({
  currentSymbol,
  onSelectSymbol,
  currentTimeframe,
  onSelectTimeframe,
  chartType,
  onSelectChartType,
  layout,
  onSelectLayout,
  activeIndicatorsCount,
  onOpenIndicatorsModal,
  onOpenTemplatesModal,
  onOpenAlertsModal,
  onOpenCompareModal,
  onOpenSettingsModal,
  onTakeScreenshot,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isWatchlistOpen,
  onToggleWatchlist,
  theme,
}) => {
  // Dropdown states
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] = useState(false);
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);

  // Symbol Search & Categories Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES' | 'FAVORITES'>('ALL');
  const [favorites, setFavorites] = useState<string[]>(() => ['EURUSD', 'GBPUSD', 'BTCUSD', 'XAUUSD', 'NAS100']);
  const [recentSymbols, setRecentSymbols] = useState<string[]>(['EURUSD', 'BTCUSD', 'NAS100']);

  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const tfDropdownRef = useRef<HTMLDivElement>(null);
  const ctDropdownRef = useRef<HTMLDivElement>(null);
  const layoutDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(e.target as Node)) {
        setIsSymbolDropdownOpen(false);
      }
      if (tfDropdownRef.current && !tfDropdownRef.current.contains(e.target as Node)) {
        setIsTimeframeDropdownOpen(false);
      }
      if (ctDropdownRef.current && !ctDropdownRef.current.contains(e.target as Node)) {
        setIsChartTypeDropdownOpen(false);
      }
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(e.target as Node)) {
        setIsLayoutDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => (prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]));
  };

  const handleSelectSymbol = (sym: string) => {
    onSelectSymbol(sym);
    setIsSymbolDropdownOpen(false);
    setRecentSymbols(prev => [sym, ...prev.filter(s => s !== sym)].slice(0, 5));
  };

  // Filter symbols based on search & category tab
  const filteredInstruments = INSTRUMENTS.filter(inst => {
    const matchesSearch =
      inst.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'FAVORITES') return favorites.includes(inst.symbol);
    return inst.category === selectedCategory;
  });

  const currentInst = INSTRUMENTS.find(i => i.symbol === currentSymbol) || INSTRUMENTS[0];
  const currentChartTypeObj = CHART_TYPES.find(ct => ct.id === chartType) || CHART_TYPES[0];

  return (
    <div
      className={`w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-2xl border transition-all ${
        theme === 'liquid'
          ? 'bg-slate-900/80 border-slate-700/60 backdrop-blur-md shadow-xl'
          : theme === 'dark'
          ? 'bg-slate-950/90 border-slate-800 shadow-md'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* 1. LEFT ZONE: SYMBOL SEARCH + TIMEFRAMES + CHART TYPE */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Symbol Selector Button & Modal Trigger */}
        <div className="relative" ref={symbolDropdownRef}>
          <button
            onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">{currentSymbol}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                {currentInst.name}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Symbol Search Dropdown Modal */}
          {isSymbolDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              {/* Search input */}
              <div className="relative mb-2.5">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search symbol, FX pair, crypto, index..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  autoFocus
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-800 custom-scrollbar text-[10px] font-bold">
                {(['ALL', 'FAVORITES', 'FOREX', 'CRYPTO', 'INDICES', 'COMMODITIES'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'FAVORITES' ? '⭐ Favorites' : cat}
                  </button>
                ))}
              </div>

              {/* Symbol List */}
              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {filteredInstruments.map(inst => {
                  const isFav = favorites.includes(inst.symbol);
                  const isSelected = inst.symbol === currentSymbol;
                  const isPositive = (inst.change24h || 0) >= 0;

                  return (
                    <div
                      key={inst.symbol}
                      onClick={() => handleSelectSymbol(inst.symbol)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={e => toggleFavorite(inst.symbol, e)}
                          className="text-slate-500 hover:text-amber-400 transition"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                            }`}
                          />
                        </button>
                        <div>
                          <div className="font-bold font-mono text-white flex items-center gap-1.5">
                            {inst.symbol}
                            <span className="text-[9px] font-normal text-slate-400 px-1 py-0.2 rounded bg-slate-950 border border-slate-800">
                              {inst.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {inst.name}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-white font-semibold">
                          {inst.defaultPrice.toFixed(inst.decimals)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {inst.change24h}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Watchlist Toggle */}
        <button
          onClick={onToggleWatchlist}
          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
            isWatchlistOpen
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Watchlist Drawer"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {/* Timeframe Quick Buttons & Dropdown */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs">
          {['1m', '5m', '15m', '1H', '4H', '1D'].map(tf => (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf as TimeframeId)}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                currentTimeframe === tf
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}

          {/* More Timeframes Dropdown */}
          <div className="relative" ref={tfDropdownRef}>
            <button
              onClick={() => setIsTimeframeDropdownOpen(!isTimeframeDropdownOpen)}
              className="px-1.5 py-1 text-slate-400 hover:text-white transition"
              title="More Timeframes"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {isTimeframeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-32 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 z-50">
                {TIMEFRAMES.map(tf => (
                  <button
                    key={tf.id}
                    onClick={() => {
                      onSelectTimeframe(tf.id);
                      setIsTimeframeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition text-left cursor-pointer ${
                      currentTimeframe === tf.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{tf.label}</span>
                    {currentTimeframe === tf.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart Type Selector Dropdown */}
        <div className="relative" ref={ctDropdownRef}>
          <button
            onClick={() => setIsChartTypeDropdownOpen(!isChartTypeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <span>{currentChartTypeObj.icon}</span>
            <span className="hidden md:inline">{currentChartTypeObj.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isChartTypeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-1 z-50">
              {CHART_TYPES.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => {
                    onSelectChartType(ct.id);
                    setIsChartTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition text-left cursor-pointer ${
                    chartType === ct.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{ct.icon}</span>
                  <span>{ct.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. MIDDLE ZONE: INDICATORS, TEMPLATES, ALERTS, COMPARE */}
      <div className="flex items-center gap-1">
        {/* Indicators Modal Trigger */}
        <button
          onClick={onOpenIndicatorsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 font-bold text-xs transition cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Indicators</span>
          {activeIndicatorsCount > 0 && (
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-mono">
              {activeIndicatorsCount}
            </span>
          )}
        </button>

        {/* Templates Modal Trigger */}
        <button
          onClick={onOpenTemplatesModal}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          title="Chart & Indicator Templates"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Templates</span>
        </button>

        {/* Alerts Modal Trigger */}
        <button
          onClick={onOpenAlertsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          title="Price & Technical Alerts"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Alerts</span>
        </button>

        {/* Compare Symbol Modal Trigger */}
        <button
          onClick={onOpenCompareModal}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          title="Compare with another asset"
        >
          <GitCompare className="w-3.5 h-3.5 text-sky-400" />
          <span>Compare</span>
        </button>
      </div>

      {/* 3. RIGHT ZONE: UNDO/REDO, LAYOUT, SCREENSHOT, SETTINGS */}
      <div className="flex items-center gap-1">
        {/* Undo / Redo */}
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo Drawing"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo Drawing"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-Chart Layout Picker */}
        <div className="relative" ref={layoutDropdownRef}>
          <button
            onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Chart Layouts (Single, 2-Split, 4-Grid)"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {isLayoutDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-xl p-2 z-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 px-1">Chart Layouts</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'SINGLE', label: '1 Single', icon: '◻️' },
                  { id: 'TWO_HORIZONTAL', label: '2 Horiz', icon: '◫' },
                  { id: 'TWO_VERTICAL', label: '2 Vert', icon: '◫' },
                  { id: 'FOUR_GRID', label: '4 Grid', icon: '⊞' },
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onSelectLayout(l.id as ChartLayoutType);
                      setIsLayoutDropdownOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition ${
                      layout === l.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Screenshot Button */}
        <button
          onClick={onTakeScreenshot}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          title="Take Chart Snapshot"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Chart Settings Modal Trigger */}
        <button
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
          title="Chart Settings & Colors"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
};
