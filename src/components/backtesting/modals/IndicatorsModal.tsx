import React, { useState } from 'react';
import {
  X,
  Search,
  Sliders,
  Eye,
  EyeOff,
  Trash2,
  Check,
  TrendingUp,
  Activity,
  Layers,
  BarChart2,
  Plus,
} from 'lucide-react';
import { IndicatorConfig, IndicatorCategory } from '../types';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig[];
  onUpdateIndicators: (indicators: IndicatorConfig[]) => void;
}

interface AvailableIndicatorTemplate {
  type: string;
  name: string;
  category: IndicatorCategory;
  pane: 'MAIN' | 'LOWER_1' | 'LOWER_2';
  description: string;
  defaultParams: Record<string, number | string | boolean>;
  defaultStyles: {
    color: string;
    lineWidth: number;
    secondaryColor?: string;
  };
}

const AVAILABLE_INDICATORS: AvailableIndicatorTemplate[] = [
  // Trend
  {
    type: 'SMA',
    name: 'Simple Moving Average (SMA)',
    category: 'TREND',
    pane: 'MAIN',
    description: 'Arithmetic mean of closing prices over a specified period.',
    defaultParams: { period: 20 },
    defaultStyles: { color: '#38bdf8', lineWidth: 2 },
  },
  {
    type: 'EMA',
    name: 'Exponential Moving Average (EMA)',
    category: 'TREND',
    pane: 'MAIN',
    description: 'Weighted moving average giving higher priority to recent price points.',
    defaultParams: { period: 50 },
    defaultStyles: { color: '#f59e0b', lineWidth: 2 },
  },
  {
    type: 'WMA',
    name: 'Weighted Moving Average (WMA)',
    category: 'TREND',
    pane: 'MAIN',
    description: 'Linear weighted moving average for quick reaction to price changes.',
    defaultParams: { period: 20 },
    defaultStyles: { color: '#a855f7', lineWidth: 2 },
  },
  {
    type: 'VWAP',
    name: 'Volume Weighted Average Price (VWAP)',
    category: 'TREND',
    pane: 'MAIN',
    description: 'Institutional benchmark showing intraday average price weighted by volume.',
    defaultParams: {},
    defaultStyles: { color: '#ec4899', lineWidth: 2 },
  },
  {
    type: 'SUPERTREND',
    name: 'Supertrend Indicator',
    category: 'TREND',
    pane: 'MAIN',
    description: 'ATR-based trailing stop indicator that highlights trend direction.',
    defaultParams: { period: 10, multiplier: 3 },
    defaultStyles: { color: '#10b981', lineWidth: 2 },
  },
  {
    type: 'PARABOLIC_SAR',
    name: 'Parabolic SAR',
    category: 'TREND',
    pane: 'MAIN',
    description: 'Stop and Reverse dots identifying trailing potential price breakouts.',
    defaultParams: { step: 0.02, maxStep: 0.2 },
    defaultStyles: { color: '#6366f1', lineWidth: 2 },
  },

  // Momentum
  {
    type: 'RSI',
    name: 'Relative Strength Index (RSI)',
    category: 'MOMENTUM',
    pane: 'LOWER_1',
    description: 'Momentum oscillator measuring the speed and change of price moves (0-100).',
    defaultParams: { period: 14, overbought: 70, oversold: 30 },
    defaultStyles: { color: '#a855f7', lineWidth: 2 },
  },
  {
    type: 'MACD',
    name: 'Moving Average Convergence Divergence (MACD)',
    category: 'MOMENTUM',
    pane: 'LOWER_1',
    description: 'Trend-following momentum indicator with fast/slow EMAs and histogram bars.',
    defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    defaultStyles: { color: '#38bdf8', secondaryColor: '#f97316', lineWidth: 2 },
  },
  {
    type: 'STOCHASTIC',
    name: 'Stochastic Oscillator',
    category: 'MOMENTUM',
    pane: 'LOWER_1',
    description: 'Compares a particular closing price to a range of its prices over time.',
    defaultParams: { kPeriod: 14, dPeriod: 3 },
    defaultStyles: { color: '#10b981', secondaryColor: '#f43f5e', lineWidth: 2 },
  },
  {
    type: 'CCI',
    name: 'Commodity Channel Index (CCI)',
    category: 'MOMENTUM',
    pane: 'LOWER_1',
    description: 'Measures the current price level relative to an average over a given period.',
    defaultParams: { period: 20 },
    defaultStyles: { color: '#06b6d4', lineWidth: 2 },
  },

  // Volatility
  {
    type: 'BOLLINGER',
    name: 'Bollinger Bands',
    category: 'VOLATILITY',
    pane: 'MAIN',
    description: 'Standard deviation envelope plotted around a central moving average.',
    defaultParams: { period: 20, stdDev: 2 },
    defaultStyles: { color: '#38bdf8', lineWidth: 1.5 },
  },
  {
    type: 'ATR',
    name: 'Average True Range (ATR)',
    category: 'VOLATILITY',
    pane: 'LOWER_1',
    description: 'Measures market volatility by decomposing the entire range of an asset price.',
    defaultParams: { period: 14 },
    defaultStyles: { color: '#f59e0b', lineWidth: 2 },
  },

  // Volume
  {
    type: 'VOLUME_PROFILE',
    name: 'Volume Profile (Visible Range)',
    category: 'VOLUME',
    pane: 'MAIN',
    description: 'Horizontal volume histogram showing traded volume at specific price levels.',
    defaultParams: { buckets: 24 },
    defaultStyles: { color: '#eab308', lineWidth: 1 },
  },
  {
    type: 'OBV',
    name: 'On-Balance Volume (OBV)',
    category: 'VOLUME',
    pane: 'LOWER_1',
    description: 'Uses volume flow to predict changes in stock price.',
    defaultParams: {},
    defaultStyles: { color: '#10b981', lineWidth: 2 },
  },
];

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onUpdateIndicators,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | IndicatorCategory>('ALL');

  if (!isOpen) return null;

  const filteredList = AVAILABLE_INDICATORS.filter(ind => {
    const matchesSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'ALL') return true;
    return ind.category === activeCategory;
  });

  const handleAddIndicator = (template: AvailableIndicatorTemplate) => {
    const newIndicator: IndicatorConfig = {
      id: `${template.type}_${Date.now()}`,
      type: template.type,
      name: template.name,
      category: template.category,
      pane: template.pane,
      visible: true,
      params: { ...template.defaultParams },
      styles: { ...template.defaultStyles },
    };
    onUpdateIndicators([...indicators, newIndicator]);
  };

  const handleToggleVisible = (id: string) => {
    onUpdateIndicators(
      indicators.map(ind => (ind.id === id ? { ...ind, visible: !ind.visible } : ind))
    );
  };

  const handleRemoveIndicator = (id: string) => {
    onUpdateIndicators(indicators.filter(ind => ind.id !== id));
  };

  const handleUpdateParam = (id: string, key: string, val: any) => {
    onUpdateIndicators(
      indicators.map(ind =>
        ind.id === id
          ? {
              ...ind,
              params: {
                ...ind.params,
                [key]: val,
              },
            }
          : ind
      )
    );
  };

  const handleUpdateColor = (id: string, color: string) => {
    onUpdateIndicators(
      indicators.map(ind =>
        ind.id === id
          ? {
              ...ind,
              styles: {
                ...ind.styles,
                color,
              },
            }
          : ind
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Indicators & Technical Studies</h2>
              <p className="text-xs text-slate-400">Add overlays and sub-pane technical oscillators</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Active Applied Indicators */}
          {indicators.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Active Studies ({indicators.length})</span>
                <button
                  onClick={() => onUpdateIndicators([])}
                  className="text-rose-400 hover:text-rose-300 transition text-[11px] cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-2">
                {indicators.map(ind => (
                  <div
                    key={ind.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={ind.styles.color}
                        onChange={e => handleUpdateColor(ind.id, e.target.value)}
                        className="w-6 h-6 rounded-md bg-transparent border-0 cursor-pointer"
                        title="Change indicator line color"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {ind.name}
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                            {ind.pane}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parameters Editor */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(ind.params).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1 text-[11px] bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                          <span className="text-slate-400 capitalize">{k}:</span>
                          <input
                            type="number"
                            value={Number(v)}
                            onChange={e => handleUpdateParam(ind.id, k, parseFloat(e.target.value) || 0)}
                            className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-white font-mono text-center focus:outline-none"
                          />
                        </div>
                      ))}

                      {/* Actions */}
                      <button
                        onClick={() => handleToggleVisible(ind.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
                      >
                        {ind.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-600" />}
                      </button>

                      <button
                        onClick={() => handleRemoveIndicator(ind.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Categories */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search indicator library (e.g. RSI, EMA, Bollinger, VWAP)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'TREND', 'MOMENTUM', 'VOLATILITY', 'VOLUME'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Available Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map(template => {
              const isAlreadyAdded = indicators.some(ind => ind.type === template.type);

              return (
                <div
                  key={template.type}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{template.name}</h4>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Pane: {template.pane === 'MAIN' ? 'Overlay (Main)' : 'Lower Sub-Pane'}
                    </span>
                    <button
                      onClick={() => handleAddIndicator(template)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
